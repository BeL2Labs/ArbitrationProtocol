// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../interfaces/ICompensationManager.sol";
import "../interfaces/IZkService.sol";
import "../interfaces/ITransactionManager.sol";
import "../interfaces/IConfigManager.sol";
import "../interfaces/IArbitratorManager.sol";
import "../libraries/Errors.sol";
import "../libraries/DataTypes.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "hardhat/console.sol";

contract CompensationManager is 
    ICompensationManager,
    OwnableUpgradeable 
{
    IZkService public zkService;
    ITransactionManager public transactionManager;
    IConfigManager public configManager;
    IArbitratorManager public arbitratorManager;

    // Mapping from claim ID to compensation details
    mapping(bytes32 => CompensationClaim) public claims;

    struct CompensationClaim {
        address dapp;
        address arbitrator;
        uint256 ethAmount;
        address nftContract;
        uint256[] nftTokenIds;
        uint256 totalAmount;
        bool withdrawn;
        CompensationType claimType;
        address receivedCompensationAddress;
    }

    enum CompensationType {
        IllegalSignature,
        Timeout,
        FailedArbitration,
        ArbitratorFee
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract with required addresses
     * @param _zkService Address of the ZkService contract
     * @param _transactionManager Address of the transaction manager contract
     * @param _configManager Address of the config manager contract
     * @param _arbitratorManager Address of the arbitrator manager contract
     */
    function initialize(
        address _zkService,
        address _transactionManager,
        address _configManager,
        address _arbitratorManager
    ) public initializer {
        __Ownable_init(msg.sender);

        if (_zkService == address(0)) revert(Errors.ZERO_ADDRESS);
        if (_transactionManager == address(0)) revert(Errors.ZERO_ADDRESS);
        if (_configManager == address(0)) revert(Errors.ZERO_ADDRESS);
        if (_arbitratorManager == address(0)) revert(Errors.ZERO_ADDRESS);

        zkService = IZkService(_zkService);
        transactionManager = ITransactionManager(_transactionManager);
        configManager = IConfigManager(_configManager);
        arbitratorManager = IArbitratorManager(_arbitratorManager);
    }

    function _validateUTXOConsistency(
        DataTypes.UTXO[] memory zkServiceUtxos, 
        DataTypes.UTXO[] memory transactionUtxos
    ) internal pure {
        // Check if UTXO arrays have the same length
        if (zkServiceUtxos.length != transactionUtxos.length) {
            revert(Errors.INVALID_UTXO);
        }

        // Compare each UTXO
        for (uint256 i = 0; i < zkServiceUtxos.length; i++) {
            // Compare txHash
            if (zkServiceUtxos[i].txHash != transactionUtxos[i].txHash) {
                revert(Errors.INVALID_UTXO);
            }

            // Compare index
            if (zkServiceUtxos[i].index != transactionUtxos[i].index) {
                revert(Errors.INVALID_UTXO);
            }

            // Compare script
            if (keccak256(zkServiceUtxos[i].script) != keccak256(transactionUtxos[i].script)) {
                revert(Errors.INVALID_UTXO);
            }

            // Compare amount
            if (zkServiceUtxos[i].amount != transactionUtxos[i].amount) {
                revert(Errors.INVALID_UTXO);
            }
        }
    }

    function _getCompensationAddress(
        DataTypes.ArbitratorInfo memory arbitratorInfo, 
        address sender
    ) internal view returns (address) {
        if (arbitratorInfo.activeTransactionId == 0) {
            revert(Errors.NO_ACTIVE_TRANSACTION);
        }
        
        DataTypes.Transaction memory transaction = transactionManager.getTransactionById(arbitratorInfo.activeTransactionId);
        if (transaction.dapp != sender) {
            revert(Errors.NOT_TRANSACTION_OWNER);
        }

        return transaction.compensationReceiver;
    }

    function claimIllegalSignatureCompensation(
        address arbitrator,
        bytes calldata btcTx,
        bytes32 evidence
    ) external override returns (bytes32 claimId) {
        // Generate claim ID
        claimId = keccak256(abi.encodePacked(evidence, arbitrator, msg.sender, "IllegalSignature"));
        if (claims[claimId].dapp != address(0)) {
            revert (Errors.COMPENSATION_ALREADY_CLAIMED);
        }

        // Get ZK verification details with minimal local variables
        DataTypes.ZKVerification memory verification = zkService.getZkVerification(evidence);

        // Basic data validation
        if(verification.rawData.length == 0 || verification.pubKey.length == 0 || verification.txHash == bytes32(0)) {
            revert(Errors.INVALID_VERIFICATION_DATA);
        }
        if (!verification.verified) {
            revert(Errors.SIGNATURE_MISMATCH);
        }

        // Check transaction existence
        if (transactionManager.txHashToId(verification.txHash) != bytes32(0)) {
            revert(Errors.TRANSACTION_EXISTS);
        }

        // Get arbitrator details
        DataTypes.ArbitratorInfo memory arbitratorInfo = arbitratorManager.getArbitratorInfo(arbitrator);

        // Validate arbitrator details
        if (arbitratorInfo.operatorBtcPubKey.length == 0) {
            revert(Errors.INVALID_VERIFICATION_DATA);
        }

        // Validate public key
        if (keccak256(verification.pubKey) != keccak256(arbitratorInfo.operatorBtcPubKey)) {
            revert(Errors.INVALID_VERIFICATION_DATA);
        }

        // Validate transaction data
        if (keccak256(btcTx) != keccak256(verification.rawData)) {
            revert(Errors.INVALID_VERIFICATION_DATA);
        }

        // Get compensation address
        address receivedCompensationAddress = _getCompensationAddress(arbitratorInfo, msg.sender);

        // Validate stake
        uint256 stakeAmount = arbitratorManager.getAvailableStake(arbitrator);
        if (stakeAmount == 0) {
            revert(Errors.NO_STAKE_AVAILABLE);
        }

        // Create compensation claim
        claims[claimId] = CompensationClaim({
            dapp: msg.sender,
            arbitrator: arbitrator,
            ethAmount: arbitratorInfo.ethAmount,
            nftContract: arbitratorInfo.nftContract,
            nftTokenIds: arbitratorInfo.nftTokenIds,
            totalAmount: stakeAmount,
            withdrawn: false,
            claimType: CompensationType.IllegalSignature,
            receivedCompensationAddress: receivedCompensationAddress
        });

        // Update arbitrator status
        arbitratorManager.terminateArbitratorWithSlash(arbitrator);

        // Emit compensation claimed event
        emit CompensationClaimed(claimId, msg.sender, uint8(CompensationType.IllegalSignature));
    }

    function claimTimeoutCompensation(bytes32 id) external override returns (bytes32 claimId) {
        // Get transaction details
        DataTypes.Transaction memory transaction = transactionManager.getTransactionById(id);

        // Generate claim ID
        claimId = keccak256(abi.encodePacked(id, transaction.arbitrator, msg.sender, "Timeout"));
        if (claims[claimId].dapp != address(0)) {
            revert (Errors.COMPENSATION_ALREADY_CLAIMED);
        }

        if (transaction.dapp != msg.sender) revert(Errors.NOT_TRANSACTION_OWNER);
        if (transaction.status == DataTypes.TransactionStatus.Completed) revert(Errors.TRANSACTION_COMPLETED);
        if (block.timestamp < transaction.deadline) revert(Errors.DEADLINE_NOT_REACHED);
        if (transaction.signature.length > 0) revert(Errors.SIGNATURE_ALREADY_SUBMITTED);

        // Get arbitrator's stake amount
        DataTypes.ArbitratorInfo memory arbitratorInfo = arbitratorManager.getArbitratorInfo(transaction.arbitrator);
        uint256 stakeAmount = arbitratorManager.getAvailableStake(transaction.arbitrator);
        if (stakeAmount == 0) revert(Errors.NO_STAKE_AVAILABLE);

        // Create compensation claim
        claims[claimId] = CompensationClaim({
            dapp: msg.sender,
            arbitrator: transaction.arbitrator,
            ethAmount: arbitratorInfo.ethAmount,
            nftContract: arbitratorInfo.nftContract,
            nftTokenIds: arbitratorInfo.nftTokenIds,
            totalAmount: stakeAmount,
            withdrawn: false,
            claimType: CompensationType.Timeout,
            receivedCompensationAddress: transaction.timeoutCompensationReceiver
        });

        // Update arbitrator status
        arbitratorManager.terminateArbitratorWithSlash(transaction.arbitrator);

        emit CompensationClaimed(claimId, msg.sender, uint8(CompensationType.Timeout));
    }

    function claimFailedArbitrationCompensation(
        bytes calldata btcTx,
        bytes32 evidence
    ) external override returns (bytes32 claimId) {
        // Get ZK verification details
        DataTypes.ZKVerification memory verification = zkService.getZkVerification(evidence);
        if (verification.rawData.length == 0) revert(Errors.EMPTY_RAW_DATA);
        if (verification.pubKey.length == 0) revert(Errors.EMPTY_PUBLIC_KEY);
        if (verification.txHash == bytes32(0)) revert(Errors.EMPTY_HASH);
        if (verification.signature.length == 0) revert(Errors.EMPTY_SIGNATURE);
        if (verification.verified) {revert(Errors.SIGNATURE_VERIFIED);}
        if (keccak256(btcTx) != keccak256(verification.rawData)) revert(Errors.BTC_TRANSACTION_MISMATCH);

        // Get transaction details
        DataTypes.Transaction memory transaction = transactionManager.getTransaction(verification.txHash);

        // Generate claim ID
        claimId = keccak256(abi.encodePacked(evidence, transaction.arbitrator, msg.sender, "FailedArbitration"));
        if (claims[claimId].dapp != address(0)) {
            revert (Errors.COMPENSATION_ALREADY_CLAIMED);
        }

        // Validate UTXO consistency
        _validateUTXOConsistency(verification.utxos, transaction.utxos);

        if (transaction.dapp != msg.sender) revert(Errors.NOT_TRANSACTION_OWNER);
        if (transaction.signature.length == 0) revert(Errors.SIGNATURE_NOT_SUBMITTED);

        // Get transaction signature and verify
        if (keccak256(transaction.signature) != keccak256(verification.signature)) revert(Errors.SIGNATURE_MISMATCH);

        // Get arbitrator's stake amount
        DataTypes.ArbitratorInfo memory arbitratorInfo = arbitratorManager.getArbitratorInfo(transaction.arbitrator);
        uint256 stakeAmount = arbitratorManager.getAvailableStake(transaction.arbitrator);
        if (stakeAmount == 0) revert(Errors.NO_STAKE_AVAILABLE);

        // Create compensation claim
        claims[claimId] = CompensationClaim({
            dapp: msg.sender,
            arbitrator: transaction.arbitrator,
            ethAmount: arbitratorInfo.ethAmount,
            nftContract: arbitratorInfo.nftContract,
            nftTokenIds: arbitratorInfo.nftTokenIds,
            totalAmount: stakeAmount,
            withdrawn: false,
            claimType: CompensationType.FailedArbitration,
            receivedCompensationAddress: transaction.compensationReceiver
        });

        // Update arbitrator status
        arbitratorManager.terminateArbitratorWithSlash(transaction.arbitrator);

        emit CompensationClaimed(claimId, msg.sender, uint8(CompensationType.FailedArbitration));
    }

    function claimArbitratorFee(bytes32 txId) external override returns (bytes32) {
        // Get transaction details
        DataTypes.Transaction memory transaction = transactionManager.getTransactionById(txId);
        if (transaction.arbitrator != msg.sender) revert(Errors.NOT_TRANSACTION_ARBITRATOR);
        // Transfer fees and terminate transaction
        (uint256 arbitratorFee, ) = transactionManager.transferArbitrationFee(txId);

        // Generate claim ID
        bytes32 claimId = keccak256(abi.encodePacked(txId, transaction.arbitrator, msg.sender, "ArbitratorFee"));
        if (claims[claimId].dapp != address(0)) {
            revert (Errors.COMPENSATION_ALREADY_CLAIMED);
        }

        DataTypes.ArbitratorInfo memory arbitratorInfo = arbitratorManager.getArbitratorInfo(transaction.arbitrator);
        // Create compensation claim
        claims[claimId] = CompensationClaim({
            dapp: transaction.dapp,
            arbitrator: transaction.arbitrator,
            ethAmount: arbitratorFee,
            nftContract: address(0),
            nftTokenIds: new uint256[](0),
            totalAmount: arbitratorFee,
            withdrawn: true,
            claimType: CompensationType.ArbitratorFee,
            receivedCompensationAddress: arbitratorInfo.revenueETHAddress
        });

        emit CompensationClaimed(claimId, msg.sender, uint8(CompensationType.ArbitratorFee));
        return claimId;
    }

    function withdrawCompensation(bytes32 claimId) external override payable {
        CompensationClaim storage claim = claims[claimId];
        if (claim.withdrawn) revert(Errors.COMPENSATION_WITHDRAWN);
        if (claim.ethAmount == 0 && claim.nftTokenIds.length == 0) revert(Errors.NO_COMPENSATION_AVAILABLE);

        uint256 systemFeeRate = configManager.getSystemCompensationFeeRate();
        uint256 systemFee = claim.totalAmount * systemFeeRate / 10000;
        if (msg.value < systemFee) revert(Errors.INSUFFICIENT_SYSTEM_FEE);
        if (claim.receivedCompensationAddress == address(0)) revert(Errors.NO_COMPENSATION_AVAILABLE);
        uint256 ethAmount = claim.ethAmount;
        // Mark as withdrawn
        claim.withdrawn = true;
        if (claim.ethAmount > 0 && claim.receivedCompensationAddress != address(0)) {
            claim.ethAmount = 0;
            (bool success, ) = claim.receivedCompensationAddress.call{value: ethAmount}("");
            require(success, "TransferFailed");
        }

        // Transfer NFT compensation
        if (claim.receivedCompensationAddress != address(0)) {
            for (uint256 i = 0; i < claim.nftTokenIds.length; i++) {
                IERC721(claim.nftContract).transferFrom(address(this), claim.receivedCompensationAddress, claim.nftTokenIds[i]);
            }
        }

        // Transfer system fee to fee collector
        address payable feeCollector = payable(configManager.getSystemFeeCollector());
        feeCollector.transfer(systemFee);

        // Refund excess payment
        if (msg.value > systemFee) {
            (bool success, ) = msg.sender.call{value: msg.value - systemFee}("");
            require(success, "TransferFailed");
        }

        emit CompensationWithdrawn(claimId);
    }

    function getClaimableAmount(bytes32 claimId) external view override returns (uint256) {
        CompensationClaim storage claim = claims[claimId];
        if (claim.withdrawn) {
            return 0;
        }
        return claim.totalAmount;
    }

    receive() external payable {
    }



    // Setter for ZkService
    function setZkService(address _zkService) external onlyOwner {
        require(address(_zkService) != address(0), "Invalid ZkService address");
        zkService = IZkService(_zkService);
        emit ZkServiceUpdated(address(_zkService));
    }

    // Setter for TransactionManager
    function setTransactionManager(address _transactionManager) external onlyOwner {
        require(address(_transactionManager) != address(0), "Invalid TransactionManager address");
        transactionManager = ITransactionManager(_transactionManager);
        emit TransactionManagerUpdated(address(_transactionManager));
    }

    // Setter for ConfigManager
    function setConfigManager(address _configManager) external onlyOwner {
        require(address(_configManager) != address(0), "Invalid ConfigManager address");
        configManager = IConfigManager(_configManager);
        emit ConfigManagerUpdated(address(_configManager));
    }

    // Setter for ArbitratorManager
    function setArbitratorManager(address _arbitratorManager) external onlyOwner {
        require(address(_arbitratorManager) != address(0), "Invalid ArbitratorManager address");
        arbitratorManager = IArbitratorManager(_arbitratorManager);
        emit ArbitratorManagerUpdated(address(_arbitratorManager));
    }

    // Add a gap for future storage variables
    uint256[50] private __gap;
}