// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../interfaces/ICompensationManager.sol";
import "../interfaces/IZkService.sol";
import "../interfaces/ISignatureValidationService.sol";
import "../interfaces/ITransactionManager.sol";
import "../interfaces/IConfigManager.sol";
import "../interfaces/IArbitratorManager.sol";
import "../libraries/Errors.sol";
import "../libraries/DataTypes.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

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

    ISignatureValidationService public signatureValidationService;

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
     * @param _signatureValidationService Address of the signature validation service
     */
    function initialize(
        address _zkService,
        address _configManager,
        address _arbitratorManager,
        address _signatureValidationService
    ) public initializer {
        __Ownable_init(msg.sender);

        if (_zkService == address(0)
            || _configManager == address(0)
            || _arbitratorManager == address(0)
            || _signatureValidationService == address(0)) revert (Errors.ZERO_ADDRESS);

        zkService = IZkService(_zkService);
        configManager = IConfigManager(_configManager);
        arbitratorManager = IArbitratorManager(_arbitratorManager);
        signatureValidationService = ISignatureValidationService(_signatureValidationService);
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
        bytes32 evidence
    ) external override returns (bytes32 claimId) {
        // Get arbitrator details
        DataTypes.ArbitratorInfo memory arbitratorInfo = arbitratorManager.getArbitratorInfo(arbitrator);
        if (arbitratorInfo.activeTransactionId == 0) {
            revert (Errors.NO_ACTIVE_TRANSACTION);
        }
        
        DataTypes.TransactionData memory transactionData = transactionManager.getTransactionDataById(arbitratorInfo.activeTransactionId);
        if (transactionData.status != DataTypes.TransactionStatus.Active) {
            revert (Errors.NO_ACTIVE_TRANSACTION);
        }

        // Generate claim ID
        DataTypes.TransactionParties memory transaction = transactionManager.getTransactionPartiesById(arbitratorInfo.activeTransactionId);
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

        // Validate UTXO consistency
        DataTypes.UTXO[] memory transactionUTXOs = transactionManager.getTransactionUTXOsById(arbitratorInfo.activeTransactionId);
        _validateUTXOConsistency(verification.utxos, transactionUTXOs);

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
        emit CompensationClaimed(
            claimId,
            msg.sender,
            arbitrator,
            arbitratorInfo.ethAmount,
            arbitratorInfo.nftTokenIds,
            stakeAmount,
            transaction.compensationReceiver,
            uint8(CompensationType.IllegalSignature)
        );
    }

    function claimTimeoutCompensation(bytes32 id) external override returns (bytes32 claimId) {
        // Get transaction parties
        DataTypes.TransactionParties memory transactionParties = transactionManager.getTransactionPartiesById(id);
        // Generate claim ID
        claimId = keccak256(abi.encodePacked(id, transactionParties.arbitrator, transactionParties.timeoutCompensationReceiver, CompensationType.Timeout));
        if (claims[claimId].claimer != address(0)) {
            revert (Errors.COMPENSATION_ALREADY_CLAIMED);
        }
        // Get transaction data
        DataTypes.TransactionData memory transactionData = transactionManager.getTransactionDataById(id);
        if (transactionData.status != DataTypes.TransactionStatus.Arbitrated) revert (Errors.TRANSACTION_NOT_IN_ARBITRATED);

        uint256 configTime = configManager.getArbitrationTimeout();
        if (transactionData.requestArbitrationTime + configTime > block.timestamp) revert (Errors.DEADLINE_NOT_REACHED);

        // Get arbitrator's stake amount
        DataTypes.ArbitratorInfo memory arbitratorInfo = arbitratorManager.getArbitratorInfo(transactionParties.arbitrator);
        uint256 stakeAmount = arbitratorManager.getAvailableStake(transactionParties.arbitrator);
        if (stakeAmount == 0) revert (Errors.NO_STAKE_AVAILABLE);

        // Create compensation claim
        claims[claimId] = CompensationClaim({
            claimer: msg.sender,
            arbitrator: transactionParties.arbitrator,
            ethAmount: arbitratorInfo.ethAmount,
            nftContract: arbitratorInfo.nftContract,
            nftTokenIds: arbitratorInfo.nftTokenIds,
            totalAmount: stakeAmount,
            withdrawn: false,
            claimType: CompensationType.Timeout,
            receivedCompensationAddress: transactionParties.timeoutCompensationReceiver
        });

        // Update arbitrator status
        arbitratorManager.terminateArbitratorWithSlash(transactionParties.arbitrator);
        transactionManager.completeTransactionWithSlash(arbitratorInfo.activeTransactionId, transactionParties.timeoutCompensationReceiver);
        emit CompensationClaimed(
            claimId,
            msg.sender,
            transactionParties.arbitrator,
            arbitratorInfo.ethAmount,
            arbitratorInfo.nftTokenIds,
            stakeAmount,
            transactionParties.timeoutCompensationReceiver,
            uint8(CompensationType.Timeout));
    }

    function claimFailedArbitrationCompensation(
        bytes32 evidence
    ) external override returns (bytes32 claimId) {
        // Get ZK verification details
        (bool verified, bytes32 msghash, bytes memory signature, bytes memory pubkey)
            = signatureValidationService.getResult(evidence);
        if (msghash == bytes32(0) || signature.length == 0 || pubkey.length == 0) {
            revert(Errors.ZK_PROOF_FAILED);
        }

        if (verified) {
            revert(Errors.SIGNATURE_VERIFIED);
        }

        // Get transaction parties
        DataTypes.TransactionParties memory transactionParties = transactionManager.getTransactionPartiesByTxHash(msghash);
        if (transactionParties.dapp == address(0) || transactionParties.arbitrator == address(0)) {
            revert (Errors.NO_ACTIVE_TRANSACTION);
        }

        // Generate claim ID
        claimId = keccak256(abi.encodePacked(evidence, transactionParties.arbitrator, transactionParties.timeoutCompensationReceiver, CompensationType.FailedArbitration));
        if (claims[claimId].claimer != address(0)) {
            revert (Errors.COMPENSATION_ALREADY_CLAIMED);
        }

        // Get transaction signature and verify
        bytes memory transaction_signature = transactionManager.getTransactionSignatureByTxHash(msghash);
        if (transaction_signature.length == 0) revert (Errors.SIGNATURE_NOT_SUBMITTED);
        if (keccak256(transaction_signature) != keccak256(signature)) revert (Errors.SIGNATURE_MISMATCH);

        DataTypes.ArbitratorInfo memory arbitratorInfo = arbitratorManager.getArbitratorInfo(transactionParties.arbitrator);

        // Validate public key
        if (keccak256(pubkey) != keccak256(arbitratorInfo.operatorBtcPubKey)) {
            revert (Errors.PUBLIC_KEY_MISMATCH);
        }

        // Get arbitrator's stake amount
        uint256 stakeAmount = arbitratorManager.getAvailableStake(transactionParties.arbitrator);
        if (stakeAmount == 0) revert (Errors.NO_STAKE_AVAILABLE);

        // Create compensation claim
        claims[claimId] = CompensationClaim({
            claimer: msg.sender,
            arbitrator: transactionParties.arbitrator,
            ethAmount: arbitratorInfo.ethAmount,
            nftContract: arbitratorInfo.nftContract,
            nftTokenIds: arbitratorInfo.nftTokenIds,
            totalAmount: stakeAmount,
            withdrawn: false,
            claimType: CompensationType.FailedArbitration,
            receivedCompensationAddress: transactionParties.compensationReceiver
        });

        // Update arbitrator status
        arbitratorManager.terminateArbitratorWithSlash(transactionParties.arbitrator);
        transactionManager.completeTransactionWithSlash(arbitratorInfo.activeTransactionId, transactionParties.compensationReceiver);
        emit CompensationClaimed(
            claimId,
            msg.sender,
            transactionParties.arbitrator,
            arbitratorInfo.ethAmount,
            arbitratorInfo.nftTokenIds,
            stakeAmount,
            transactionParties.compensationReceiver,
            uint8(CompensationType.FailedArbitration));
    }

    function getWithdrawCompensationFee(bytes32 claimId) external view override returns (uint256) {
        CompensationClaim storage claim = claims[claimId];
        uint256 systemFeeRate = configManager.getSystemCompensationFeeRate();
        uint256 systemFee = claim.totalAmount * systemFeeRate / 10000;
        return systemFee;
    }

    function withdrawCompensation(bytes32 claimId) external override payable {
        CompensationClaim storage claim = claims[claimId];
        if (claim.withdrawn) revert (Errors.COMPENSATION_WITHDRAWN);
        if (claim.ethAmount == 0 && claim.nftTokenIds.length == 0) revert (Errors.NO_COMPENSATION_AVAILABLE);
        if (claim.receivedCompensationAddress == address(0)) revert (Errors.ZERO_ADDRESS);

        uint256 systemFee = this.getWithdrawCompensationFee(claimId);
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
        uint256 excessPayment = 0;
        if (msg.value > systemFee) {
            excessPayment = msg.value - systemFee;
            (bool success, ) = msg.sender.call{value: excessPayment}("");
            require(success, "TransferFailed");
        }

        emit CompensationWithdrawn(
            claimId,
            msg.sender,
            claim.receivedCompensationAddress,
            claim.ethAmount,
            claim.nftTokenIds,
            systemFee,
            excessPayment);
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

    // Setter for SignatureValidationService
    function setSignatureValidationService(address _signatureValidationService) external onlyOwner {
        require(address(_signatureValidationService) != address(0), "Invalid SignatureValidationService address");
        signatureValidationService = ISignatureValidationService(_signatureValidationService);
        emit SignatureValidationServiceUpdated(_signatureValidationService);
    }

    // Add a gap for future storage variables
    uint256[49] private __gap;
}