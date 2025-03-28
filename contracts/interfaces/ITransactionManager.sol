// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/DataTypes.sol";

interface ITransactionManager {   
    // Register transaction
    function registerTransaction(
        address arbitrator,
        uint256 deadline,
        address compensationReceive,
        address refundAddress
    ) external payable returns (bytes32 id);

    // Upload transaction utxos, only once
    function uploadUTXOs(
        bytes32 id,
        DataTypes.UTXO[] calldata utxos) external;
    
    // Complete transaction
    function completeTransaction(bytes32 id) external;
    function completeTransactionWithSlash(bytes32 id, address receivedCompensationAddress) external;
    function isAbleCompletedTransaction(bytes32 id) external view returns (bool);
    // Request arbitration
    function requestArbitration(
       DataTypes.ArbitrationData calldata data
    ) external;
    
    // Submit arbitration result
    function submitArbitration(
        bytes32 id,
        bytes calldata btcTxSignature
    ) external;
    
    // Query transaction
    function getTransactionDataById(bytes32 id) external view returns (DataTypes.TransactionData memory);
    function getTransactionDataByTxHash(bytes32 txHash) external view returns (DataTypes.TransactionData memory);
    function getTransactionStatus(bytes32 id) external view returns (DataTypes.TransactionStatus);
    function getTransactionPartiesById(bytes32 id) external view returns (DataTypes.TransactionParties memory);
    function getTransactionPartiesByTxHash(bytes32 txHash) external view returns (DataTypes.TransactionParties memory);
    function getTransactionUTXOsById(bytes32 id) external view returns (DataTypes.UTXO[] memory);
    function getTransactionSignatureById(bytes32 id) external view returns (bytes memory);
    function getTransactionSignatureByTxHash(bytes32 txHash) external view returns (bytes memory);
    function getTransactionBtcRawDataById(bytes32 id) external view returns (bytes memory);
    function getTransactionSignHashById(bytes32 id) external view returns (bytes32);

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
    event TransactionRegistered(
        bytes32 indexed id,
        address indexed dapp,
        address indexed arbitrator,
        uint256 deadline,
        uint256 depositFee,
        address compensationReceiver);
    event UTXOsUploaded(bytes32 indexed txId, address indexed dapp);
    event TransactionCompleted(bytes32 indexed txId, address indexed dapp);
    event ArbitrationRequested(
        bytes32 indexed txId,
        address indexed dapp,
        address arbitrator,
        bytes rawData,
        bytes script,
        address timeoutCompensationReceiver);
    event ArbitrationSubmitted(
        bytes32 indexed txId,
        address indexed dapp,
        address indexed arbitrator,
        bytes btcTxSignature);
    event SetArbitratorManager(address indexed arbitratorManager);
    event BTCAddressParserChanged(address indexed newParser);
    event AssetOracleUpdated(address indexed newOracle);
    event DepositFeeTransfer(bytes32 indexed txId, address indexed revenueETHAddress, uint256 arbitratorFee, uint256 systemFee, uint256 refundedFee);
    // Functions
    function setArbitratorManager(address _arbitratorManager) external;
    function setBTCAddressParser(address _btcAddressParser) external;
}