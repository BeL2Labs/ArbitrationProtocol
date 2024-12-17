// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/DataTypes.sol";

interface ITransactionManager {   
    // Register transaction
    function registerTransaction(
        address arbitrator,
        uint256 deadline,
        address compensationReceiver
    ) external payable returns (uint256 id);
    
    // Complete transaction
    function completeTransaction(bytes32 id) external;
    
    // Request arbitration
    function requestArbitration(
        bytes32 id,
        bytes calldata btcTx,
        address timeoutCompensationReceiver
    ) external;
    
    // Submit arbitration result
    function submitArbitration(
        bytes32 id,
        bytes calldata btcTxSignature
    ) external;
    
    // Query transaction
    function getTransactionById(bytes32 id) external view returns (DataTypes.Transaction memory);
    function getTransaction(bytes32 txHash) external view returns (DataTypes.Transaction memory);

    function txHashToId(bytes32 txHash) external view returns (bytes32);

    /**
     * @notice Transfer arbitration fee to arbitrator and system fee address
     * @dev Only callable by compensation manager
     * @param id Transaction ID
     * @return arbitratorFee The fee amount for arbitrator
     * @return systemFee The fee amount for system
     */
    function transferArbitrationFee(
        bytes32 id
    ) external returns (uint256 arbitratorFee, uint256 systemFee);

    // Events
    event TransactionRegistered(bytes32 indexed id, address indexed dapp, address indexed arbitrator);
    event TransactionCompleted(address indexed dapp, bytes32 indexed txId);
    event ArbitrationRequested(address indexed dapp, bytes32 indexed txId);
    event ArbitrationSubmitted(address indexed dapp, bytes32 indexed txId);
    event TransactionCreated(bytes32 indexed id, address indexed sender, address indexed arbitrator);
    event TransactionCompleted(bytes32 indexed id, uint256 arbitratorFee, uint256 systemFee);
    event TransactionCancelled(bytes32 indexed id);
    event Initialized(address indexed compensationManager);

    // Functions
    function initialize(address _arbitratorManager, address _dappRegistry, address _configManager) external;
    function initCompensationManager(address _compensationManager) external;
}