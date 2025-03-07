// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICompensationManager {
    // Submit illegal signature compensation claim
    function claimIllegalSignatureCompensation(
        address arbitrator,
        bytes32 evidence
    ) external returns (bytes32 claimId);

    // Submit timeout compensation claim
    function claimTimeoutCompensation(
        bytes32 id
    ) external returns (bytes32 claimId);
    
    // Submit failed arbitration compensation claim
    function claimFailedArbitrationCompensation(
        bytes32 evidence
    ) external returns (bytes32 claimId);

    // Withdraw compensation
    function withdrawCompensation(bytes32 claimId) external payable;
    // Query withdrawal fee
    function getWithdrawCompensationFee(bytes32 claimId) external view returns (uint256);
    // Query claimable compensation amount
    function getClaimableAmount(
        bytes32 claimId
    ) external view returns (uint256);

    // Initialize compensation manager
    function initialize(
        address _zkService,
        address _configManager,
        address _arbitratorManager,
        address _signatureValidationService
    ) external;

    // Setter methods for critical interfaces
    function setZkService(address _zkService) external;
    function setTransactionManager(address _transactionManager) external;
    function setConfigManager(address _configManager) external;
    function setArbitratorManager(address _arbitratorManager) external;
    function setSignatureValidationService(address _signatureValidationService) external;

    // Events
    event CompensationClaimed(
        bytes32 indexed claimId,
        address indexed claimer,
        address indexed arbitrator,
        uint256 ethAmount,
        uint256[] nftTokenIds,
        uint256 totalAmount,
        address receivedCompensationAddress,
        uint8 claimType);
    event CompensationWithdrawn(
        bytes32 indexed claimId,
        address indexed claimer,
        address indexed receivedCompensationAddress,
        uint256 ethAmount,
        uint256[] nftTokenIds,
        uint256 systemFee,
        uint256 excessPaymenttoClaimer
    );
    event ZkServiceUpdated(address indexed newZkService);
    event TransactionManagerUpdated(address indexed newTransactionManager);
    event ConfigManagerUpdated(address indexed newConfigManager);
    event ArbitratorManagerUpdated(address indexed newArbitratorManager);
    event SignatureValidationServiceUpdated(address indexed newSignatureValidationService);
}