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
import {BTCUtils} from "../libraries/BTCUtils.sol";

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
        address claimer;
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
     * @param _configManager Address of the config manager contract
     * @param _arbitratorManager Address of the arbitrator manager contract
     */
    function initialize(
        address _zkService,
        address _configManager,
        address _arbitratorManager
    ) public initializer {
        __Ownable_init(msg.sender);

        if (_zkService == address(0)
            || _configManager == address(0)
            || _arbitratorManager == address(0)) revert (Errors.ZERO_ADDRESS);

        zkService = IZkService(_zkService);
        configManager = IConfigManager(_configManager);
        arbitratorManager = IArbitratorManager(_arbitratorManager);
    }

    function _validateUTXOConsistency(
        DataTypes.UTXO[] memory zkServiceUtxos, 
        DataTypes.UTXO[] memory transactionUtxos
    ) internal pure {
        // Check if UTXO arrays have the same length
        if (zkServiceUtxos.length != transactionUtxos.length) {
            revert (Errors.INVALID_UTXO);
        }

        // Compare each UTXO
        for (uint256 i = 0; i < zkServiceUtxos.length; i++) {
            // Compare txHash
            if (zkServiceUtxos[i].txHash != transactionUtxos[i].txHash) {
                revert (Errors.INVALID_UTXO);
            }

            // Compare index
            if (zkServiceUtxos[i].index != transactionUtxos[i].index) {
                revert (Errors.INVALID_UTXO);
            }

            // Compare amount
            if (zkServiceUtxos[i].amount != transactionUtxos[i].amount) {
                revert (Errors.INVALID_UTXO);
            }
        }
    }

    function claimIllegalSignatureCompensation(
        address arbitrator,
        bytes calldata btcTx,
        bytes32 evidence
    ) external override returns (bytes32 claimId) {
        // Get arbitrator details
        DataTypes.ArbitratorInfo memory arbitratorInfo = arbitratorManager.getArbitratorInfo(arbitrator);
        if (arbitratorInfo.activeTransactionId == 0) {
            revert (Errors.NO_ACTIVE_TRANSACTION);
        }

        DataTypes.Transaction memory transaction = transactionManager.getTransactionById(arbitratorInfo.activeTransactionId);
        if (transaction.status != DataTypes.TransactionStatus.Active) {
            revert (Errors.NO_ACTIVE_TRANSACTION);
        }

        // Generate claim ID
        claimId = keccak256(abi.encodePacked(evidence, arbitrator, transaction.compensationReceiver, CompensationType.IllegalSignature));
        if (claims[claimId].claimer != address(0)) {
            revert (Errors.COMPENSATION_ALREADY_CLAIMED);
        }

        // Get ZK verification details with minimal local variables
        DataTypes.ZKVerification memory verification;
        verification = zkService.getZkVerification(evidence);
        if (verification.status != 0) {
            revert(Errors.ZK_PROOF_FAILED);
        }

        // Basic data validation
        if(verification.pubKey.length == 0 || verification.txHash == bytes32(0)) {
            revert (Errors.INVALID_VERIFICATION_DATA);
        }
        if (!verification.verified) {
            revert (Errors.SIGNATURE_MISMATCH);
        }

        // Validate arbitrator details
        if (arbitratorInfo.operatorBtcPubKey.length == 0) {
            revert (Errors.INVALID_VERIFICATION_DATA);
        }

        // Validate public key
        if (keccak256(verification.pubKey) != keccak256(arbitratorInfo.operatorBtcPubKey)) {
            revert (Errors.PUBLIC_KEY_MISMATCH);
        }
        // Validate transaction data
        BTCUtils.BTCTransaction memory parsedTx = BTCUtils.parseBTCTransaction(btcTx);
        bytes memory rawData = BTCUtils.serializeBTCTransaction(parsedTx);
        if (sha256(rawData) != verification.txHash) {
            revert (Errors.BTC_TRANSACTION_MISMATCH);
        }

        // Validate UTXO consistency
        _validateUTXOConsistency(verification.utxos, transaction.utxos);

        // Validate stake
        uint256 stakeAmount = arbitratorManager.getAvailableStake(arbitrator);
        if (stakeAmount == 0) {
            revert (Errors.NO_STAKE_AVAILABLE);
        }

        // Create compensation claim
        claims[claimId] = CompensationClaim({
            claimer: msg.sender,
            arbitrator: arbitrator,
            ethAmount: arbitratorInfo.ethAmount,
            nftContract: arbitratorInfo.nftContract,
            nftTokenIds: arbitratorInfo.nftTokenIds,
            totalAmount: stakeAmount,
            withdrawn: false,
            claimType: CompensationType.IllegalSignature,
            receivedCompensationAddress: transaction.compensationReceiver
        });

        // Update arbitrator status and complete transaction
        arbitratorManager.terminateArbitratorWithSlash(arbitrator);
        transactionManager.completeTransactionWithSlash(arbitratorInfo.activeTransactionId, transaction.compensationReceiver);
        // Emit compensation claimed event
        emit CompensationClaimed(claimId, msg.sender, uint8(CompensationType.IllegalSignature));
    }

    function claimTimeoutCompensation(bytes32 id) external override returns (bytes32 claimId) {
        // Get transaction details
        DataTypes.Transaction memory transaction = transactionManager.getTransactionById(id);

        // Generate claim ID
        claimId = keccak256(abi.encodePacked(id, transaction.arbitrator, transaction.timeoutCompensationReceiver, CompensationType.Timeout));
        if (claims[claimId].claimer != address(0)) {
            revert (Errors.COMPENSATION_ALREADY_CLAIMED);
        }

        if (transaction.status != DataTypes.TransactionStatus.Arbitrated) revert (Errors.TRANSACTION_NOT_IN_ARBITRATED);

        uint256 configTime = configManager.getArbitrationTimeout();
        if (transaction.requestArbitrationTime + configTime > block.timestamp) revert (Errors.DEADLINE_NOT_REACHED);

        // Get arbitrator's stake amount
        DataTypes.ArbitratorInfo memory arbitratorInfo = arbitratorManager.getArbitratorInfo(transaction.arbitrator);
        uint256 stakeAmount = arbitratorManager.getAvailableStake(transaction.arbitrator);
        if (stakeAmount == 0) revert (Errors.NO_STAKE_AVAILABLE);

        // Create compensation claim
        claims[claimId] = CompensationClaim({
            claimer: msg.sender,
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
        transactionManager.completeTransactionWithSlash(arbitratorInfo.activeTransactionId, transaction.timeoutCompensationReceiver);
        emit CompensationClaimed(claimId, msg.sender, uint8(CompensationType.Timeout));
    }

    function claimFailedArbitrationCompensation(
        bytes calldata btcTx,
        bytes32 evidence
    ) external override returns (bytes32 claimId) {
        // Get ZK verification details
        DataTypes.ZKVerification memory verification;
        verification = zkService.getZkVerification(evidence);
        if (verification.status != 0) {
            revert(Errors.ZK_PROOF_FAILED);
        }

        if (verification.pubKey.length == 0) revert (Errors.EMPTY_PUBLIC_KEY);
        if (verification.txHash == bytes32(0)) revert (Errors.EMPTY_HASH);
        if (verification.signature.length == 0) revert (Errors.EMPTY_SIGNATURE);
        if (verification.verified) {revert (Errors.SIGNATURE_VERIFIED);}

        // Get transaction details
        DataTypes.Transaction memory transaction = transactionManager.getTransaction(verification.txHash);

        BTCUtils.BTCTransaction memory parsedTx = BTCUtils.parseBTCTransaction(btcTx);
        bytes memory rawData = BTCUtils.serializeBTCTransaction(parsedTx);
        if (sha256(rawData) != transaction.btcTxHash) revert (Errors.BTC_TRANSACTION_MISMATCH);

        // Generate claim ID
        claimId = keccak256(abi.encodePacked(evidence, transaction.arbitrator, transaction.compensationReceiver, CompensationType.FailedArbitration));
        if (claims[claimId].claimer != address(0)) {
            revert (Errors.COMPENSATION_ALREADY_CLAIMED);
        }

        // Validate UTXO consistency
        _validateUTXOConsistency(verification.utxos, transaction.utxos);

        if (transaction.signature.length == 0) revert (Errors.SIGNATURE_NOT_SUBMITTED);

        // Get transaction signature and verify
        if (keccak256(transaction.signature) != keccak256(verification.signature)) revert (Errors.SIGNATURE_MISMATCH);

        DataTypes.ArbitratorInfo memory arbitratorInfo = arbitratorManager.getArbitratorInfo(transaction.arbitrator);

        // Validate public key
        if (keccak256(verification.pubKey) != keccak256(arbitratorInfo.operatorBtcPubKey)) {
            revert (Errors.PUBLIC_KEY_MISMATCH);
        }

        // Get arbitrator's stake amount
        uint256 stakeAmount = arbitratorManager.getAvailableStake(transaction.arbitrator);
        if (stakeAmount == 0) revert (Errors.NO_STAKE_AVAILABLE);

        // Create compensation claim
        claims[claimId] = CompensationClaim({
            claimer: msg.sender,
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
        transactionManager.completeTransactionWithSlash(arbitratorInfo.activeTransactionId, transaction.compensationReceiver);
        emit CompensationClaimed(claimId, msg.sender, uint8(CompensationType.FailedArbitration));
    }

    function claimArbitratorFee(bytes32 txId) external override returns (bytes32) {
        // Get transaction details
        DataTypes.Transaction memory transaction = transactionManager.getTransactionById(txId);
        if (transaction.arbitrator != msg.sender) revert (Errors.NOT_TRANSACTION_ARBITRATOR);
        // Transfer fees and terminate transaction
        (uint256 arbitratorFee, ) = transactionManager.transferArbitrationFee(txId);

        DataTypes.ArbitratorInfo memory arbitratorInfo = arbitratorManager.getArbitratorInfo(transaction.arbitrator);
        // Generate claim ID
        bytes32 claimId = keccak256(abi.encodePacked(txId, transaction.arbitrator, arbitratorInfo.revenueETHAddress, CompensationType.ArbitratorFee));
        if (claims[claimId].claimer != address(0)) {
            revert (Errors.COMPENSATION_ALREADY_CLAIMED);
        }

        // Create compensation claim
        claims[claimId] = CompensationClaim({
            claimer: msg.sender,
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
        if (claim.withdrawn) revert (Errors.COMPENSATION_WITHDRAWN);
        if (claim.ethAmount == 0 && claim.nftTokenIds.length == 0) revert (Errors.NO_COMPENSATION_AVAILABLE);
        if (claim.receivedCompensationAddress == address(0)) revert (Errors.ZERO_ADDRESS);

        uint256 systemFeeRate = configManager.getSystemCompensationFeeRate();
        uint256 systemFee = claim.totalAmount * systemFeeRate / 10000;
        if (msg.value < systemFee) revert (Errors.INSUFFICIENT_FEE);

        // Mark as withdrawn
        claim.withdrawn = true;
        if (claim.ethAmount > 0) {
            (bool success, ) = claim.receivedCompensationAddress.call{value: claim.ethAmount}("");
            require(success, "TransferFailed");
        }

        // Transfer NFT compensation
        for (uint256 i = 0; i < claim.nftTokenIds.length; i++) {
            IERC721(claim.nftContract).transferFrom(address(this), claim.receivedCompensationAddress, claim.nftTokenIds[i]);
        }

        // Transfer system fee to fee collector
        address payable feeCollector = payable(configManager.getSystemFeeCollector());
        feeCollector.transfer(systemFee);

        // Refund excess payment
        if (msg.value > systemFee) {
            (bool success, ) = msg.sender.call{value: msg.value - systemFee}("");
            require(success, "TransferFailed");
        }

        emit CompensationWithdrawn(claimId, msg.sender, systemFee);
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