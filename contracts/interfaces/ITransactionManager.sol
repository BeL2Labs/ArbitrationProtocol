// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/DataTypes.sol";

interface ITransactionManager {
    struct RegisterData {
        address arbitrator;
        uint256 deadline;
        address compensationReceiver;
        address refundAddress;
    }
    
    // Register transaction
    function registerTransaction(
        RegisterData calldata data
    ) external payable returns (bytes32 id, string memory btcFeeAddress);

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
     * @notice Set the Bitcoin transaction that pays the arbitrator's fee
     * @dev This function verifies:
     *      1. The transaction output matches the P2SH address generated during registration
     *      2. The output amount meets the required fee
     *      3. The transaction is included in the specified block through merkle proof
     * @param id The transaction ID in the arbitration protocol
     * @param rawData The raw Bitcoin transaction data
     * @param merkleProof The merkle proof array proving transaction inclusion
     * @param index The index of the transaction in the merkle tree
     * @param blockHeight The Bitcoin block height containing this transaction
     */
    function setDAppBtcFeeTransaction(
        bytes32 id,
        bytes calldata rawData,
        bytes32[] calldata merkleProof,
        uint256 index,
        uint32 blockHeight
    ) external;

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

    /**
     * @notice Close a transaction that has not paid the BTC fee within the timeout period
     * @dev Only callable by the assigned arbitrator of the transaction
     * @param id The transaction ID
     */
    function closeUnpaidTransaction(bytes32 id) external;


    // Events
    event TransactionRegistered(
        bytes32 indexed id,
        address indexed dapp,
        address indexed arbitrator,
        uint256 deadline,
        uint256 depositFee,
        uint256 btcFee,
        address compensationReceiver,
        uint256 timestamp);
    event UTXOsUploaded(bytes32 indexed txId, address indexed dapp);
    event TransactionCompleted(bytes32 indexed txId, address indexed dapp);
    event ArbitrationRequested(
        bytes32 indexed txId,
        address indexed dapp,
        address arbitrator,
        bytes rawData,
        bytes script,
        address timeoutCompensationReceiver);

    event TransactionClosedUnpaid(
        bytes32 indexed txId,
        address indexed dapp,
        address indexed arbitrator,
        uint256 timestamp);

    event ArbitrationSubmitted(
        bytes32 indexed txId,
        address indexed dapp,
        address indexed arbitrator,
        bytes btcTxSignature);
    event SetArbitratorManager(address indexed arbitratorManager);
    event BTCAddressParserChanged(address indexed newParser);
    event DepositFeeTransfer(bytes32 indexed txId, address indexed revenueETHAddress, uint256 arbitratorFee, uint256 systemFee, uint256 refundedFee);

    event DAppFeeTransactionSet(
        bytes32 indexed id,
        bytes32 indexed txHash,
        uint256 blockHeight
    );

    event BtcBlockHeadersChanged(address indexed newBtcBlockHeaders);
    event BtcUtilsChanged(address indexed newBtcUtils);
    event ConfigManagerUpdated(address indexed newConfigManager);
    // Functions
    function setArbitratorManager(address _arbitratorManager) external;
    function setBTCAddressParser(address _btcAddressParser) external;
}