// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../interfaces/ITransactionManager.sol";
import "../interfaces/IArbitratorManager.sol";
import "../interfaces/IDAppRegistry.sol";
import "../interfaces/IConfigManager.sol";
import "../interfaces/IBTCUtils.sol";
import "../interfaces/IBtcAddress.sol";
import "../interfaces/IAssetOracle.sol";
import "../interfaces/IBtcBlockHeaders.sol";
import "../core/ConfigManager.sol";
import "../libraries/DataTypes.sol";
import "../libraries/Errors.sol";
import "../libraries/MerkleVerifier.sol";

/**
 * @title TransactionManager
 * @notice Manages transaction lifecycle in the BeLayer2 arbitration protocol
 */
contract TransactionManager is 
    ITransactionManager, 
    ReentrancyGuardUpgradeable, 
    OwnableUpgradeable 
{
    // Contract references
    IArbitratorManager public arbitratorManager;
    IDAppRegistry public dappRegistry;
    IConfigManager public configManager;
    IBTCUtils public btcUtils;
    address public compensationManager;
    IBtcAddress public btcAddressParser;

    // Transaction storage
    mapping(bytes32 => DataTypes.TransactionData) internal transactions_data;
    mapping(bytes32 => DataTypes.TransactionParties) internal transactions_parties;
    mapping(bytes32 => bytes) internal transactions_btc_raw_data;
    mapping(bytes32 => bytes) internal transactions_btc_signature;
    mapping(bytes32 => bytes) internal transactions_btc_script;
    mapping(bytes32 => DataTypes.UTXO[]) internal transactions_utxos;
    mapping(bytes32 => bytes32) internal transactions_sign_hash;
    // key is the transaction signhash
    mapping(bytes32 => bytes) public transactionSignData;
    mapping(bytes32 => bytes32) public txHashToId;
    uint256 private _transactionIdCounter;
    IAssetOracle public assetOracle; // deprecated
    IBtcBlockHeaders public btcBlockHeaders;

    modifier onlyCompensationManager() {
        if (msg.sender != compensationManager) revert(Errors.NOT_COMPENSATION_MANAGER);
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(
    ) {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract with required addresses
     * @param _arbitratorManager Address of the arbitrator manager contract
     * @param _dappRegistry Address of the DApp registry contract
     * @param _configManager Address of the config manager contract
     * @param _compensationManager Address of the compensation manager contract
     * @param _btcUtils Address of the BTC utils contract
     * @param _btcAddressParser Address of the BTC address parser contract
     */
    function initialize(
        address _arbitratorManager,
        address _dappRegistry,
        address _configManager,
        address _compensationManager,
        address _btcUtils,
        address _btcAddressParser
    ) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init(msg.sender);

        if (_arbitratorManager == address(0)
            || _dappRegistry == address(0)
            || _configManager == address(0)
            || _compensationManager == address(0)
            || _btcUtils == address(0)
            || _btcAddressParser == address(0)) revert(Errors.ZERO_ADDRESS);

        arbitratorManager = IArbitratorManager(_arbitratorManager);
        dappRegistry = IDAppRegistry(_dappRegistry);
        configManager = ConfigManager(_configManager);
        compensationManager = _compensationManager;
        btcUtils = IBTCUtils(_btcUtils);
        btcAddressParser = IBtcAddress(_btcAddressParser);
    }

    /**
     * @notice Register a new transaction with an arbitrator
     * @param data The registration data containing:
     *        - arbitrator: The arbitrator address for dispute resolution
     *        - deadline: The deadline for the transaction completion
     *        - compensationReceiver: Address to receive compensation in case of arbitration
     *        - refundAddress: Address to receive refunded fees
     * @return id The unique transaction ID
     * @return btcFeeAddress The BTC P2WSH address for arbitrator's fee payment
     */
    function registerTransaction(
        RegisterData calldata data
    ) external payable nonReentrant returns (bytes32, string memory) {
        // Validate inputs and check DApp status
        _validateRegistration(data);

        // Calculate and validate fees
        // Calculate the duration from now to the deadline
        uint256 duration = data.deadline - block.timestamp;
        uint256 fee = arbitratorManager.getFee(duration, data.arbitrator);
        if (msg.value < fee) revert(Errors.INSUFFICIENT_FEE);

        uint256 btcFee = arbitratorManager.getBtcFee(duration, data.arbitrator);

        // Generate transaction ID
        bytes32 id = keccak256(
            abi.encodePacked(
                block.timestamp,
                msg.sender,
                data.arbitrator,
                _transactionIdCounter++
            )
        );

        // Set arbitrator to working status
        arbitratorManager.setArbitratorWorking(data.arbitrator, id);

        // Store transaction data
        _storeTransactionData(id, data, msg.value, btcFee);

        // Generate BTC fee address
        string memory arbitratorFeeAddress = _generateBtcFeeAddress(id, data.arbitrator);

        emit TransactionRegistered(
            id,
            msg.sender,
            data.arbitrator,
            data.deadline,
            msg.value,
            data.compensationReceiver,
            block.timestamp
        );

        return (id, arbitratorFeeAddress);
    }

    function _validateRegistration(RegisterData calldata data) internal view {
        if (data.arbitrator == address(0) || data.compensationReceiver == address(0) || data.refundAddress == address(0)) {
            revert(Errors.ZERO_ADDRESS);
        }

        if (!dappRegistry.isActiveDApp(msg.sender)) {
            revert(Errors.DAPP_NOT_ACTIVE);
        }

        if (!arbitratorManager.isActiveArbitrator(data.arbitrator)) {
            revert(Errors.ARBITRATOR_NOT_ACTIVE);
        }

        if (data.deadline <= block.timestamp) {
            revert(Errors.INVALID_DEADLINE);
        }

        uint256 duration = data.deadline - block.timestamp;
        if (duration < configManager.getConfig(ConfigManagerKeys.MIN_TRANSACTION_DURATION) ||
            duration > configManager.getConfig(ConfigManagerKeys.MAX_TRANSACTION_DURATION)) {
            revert(Errors.INVALID_DURATION);
        }
    }

    function _storeTransactionData(
        bytes32 id,
        RegisterData calldata data,
        uint256 depositedFee,
        uint256 btcFee
    ) internal {
        DataTypes.TransactionData storage transactionData = transactions_data[id];
        DataTypes.TransactionParties storage transactionParties = transactions_parties[id];

        transactionData.startTime = block.timestamp;
        transactionData.deadline = data.deadline;
        transactionData.depositedFee = depositedFee;
        transactionData.arbitratorBtcFee = btcFee;
        transactionData.status = btcFee > 0 ? DataTypes.TransactionStatus.ToBeActive : DataTypes.TransactionStatus.Active;

        transactionParties.arbitrator = data.arbitrator;
        transactionParties.compensationReceiver = data.compensationReceiver;
        transactionParties.dapp = msg.sender;
        transactionParties.depositedFeeRefundAddress = data.refundAddress;
    }

    function _generateBtcFeeAddress(bytes32 id, address arbitrator) internal returns (string memory) {
        bytes memory revenueBtcPubKey = arbitratorManager.getArbitratorInfo(arbitrator).revenueBtcPubKey;
        bytes32 randomSeed = keccak256(abi.encodePacked(block.timestamp, msg.sender, id));

        bytes memory lockScript = abi.encodePacked(
            hex"20", // Byte length of the random seed
            randomSeed,
            hex"75", // OP_DROP
            uint8(revenueBtcPubKey.length),
            revenueBtcPubKey,
            hex"ac" // OP_CHECKSIG
        );

        string memory arbitratorFeeAddress = btcAddressParser.EncodeSegWitAddress(lockScript, "mainnet");
        transactions_data[id].btcFeeAddress = arbitratorFeeAddress;
        return arbitratorFeeAddress;
    }

    /**
    * @notice Upload UTXOs for a transaction, only once
    * @param id Transaction ID
    * @param utxos UTXO array
    */
    function uploadUTXOs(
        bytes32 id,
        DataTypes.UTXO[] calldata utxos) external {
        // Validate UTXO input, only one UTXO is allowed
        if (utxos.length != 1) revert(Errors.INVALID_UTXO);

        DataTypes.TransactionParties storage transaction = transactions_parties[id];
        if (transactions_data[id].status != DataTypes.TransactionStatus.Active) {
            revert(Errors.INVALID_TRANSACTION_STATUS);
        }

        if (msg.sender != transaction.dapp) {
            revert(Errors.NOT_AUTHORIZED);
        }

        DataTypes.UTXO[] storage transaction_utxos = transactions_utxos[id];
        if (transaction_utxos.length != 0) {
            revert(Errors.UTXO_ALREADY_UPLOADED);
        }

        for (uint i = 0; i < utxos.length; i++) {
            transaction_utxos.push(utxos[i]);
        }

        emit UTXOsUploaded(id, msg.sender);
    }

    /**
     * @notice Complete a transaction
     * @param id Transaction ID
     */
    function completeTransaction(bytes32 id) external {
        DataTypes.TransactionParties storage parties = transactions_parties[id];
        if (!this.isAbleCompletedTransaction(id)) {
            revert(Errors.CANNOT_COMPLETE_TRANSACTION);
        }

        if (msg.sender != parties.dapp) {
            revert(Errors.NOT_AUTHORIZED);
        }

        _completeTransaction(id, parties);
    }

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
    ) external {
        DataTypes.TransactionParties storage parties = transactions_parties[id];

        // Check caller authorization
        if (msg.sender != parties.dapp) {
            revert(Errors.NOT_AUTHORIZED);
        }

        // If no BTC fee is required, return immediately
        DataTypes.TransactionData storage transactionData = transactions_data[id];
        if (transactionData.arbitratorBtcFee == 0) {
            return;
        }

        // Parse transaction output
        IBTCUtils.BTCTransaction memory transaction = btcUtils.parseBTCTransaction(rawData);
        if (transaction.outputs.length != 1) {
            revert(Errors.INVALID_BTC_TX);
        }

        // verify output script
        string memory p2wshAddress = btcAddressParser.EncodeSegWitAddress(transaction.outputs[0].scriptPubKey, "mainnet");
        if (keccak256(bytes(p2wshAddress)) != keccak256(bytes(transactionData.btcFeeAddress))) {
            revert(Errors.INVALID_OUTPUT_SCRIPT);
        }

        // Verify amount
        if (transaction.outputs[0].value < transactionData.arbitratorBtcFee) {
            revert(Errors.INVALID_OUTPUT_AMOUNT);
        }

        // Get block header information
        IBtcBlockHeaders.BlockHeader memory blockHeader = btcBlockHeaders.getBlockByHeight(blockHeight);

        // Calculate transaction hash
        bytes32 txHash = btcUtils.calculateTxId(rawData);

        // Verify merkle proof
        if (!MerkleVerifier.verifyMerkleProof(txHash, blockHeader.merkleRoot, merkleProof, index)) {
            revert(Errors.INVALID_MERKLE_PROOF);
        }

        transactionData.btcFeeTxHash = txHash;
        transactionData.status = DataTypes.TransactionStatus.Active;
        emit DAppFeeTransactionSet(id, txHash, blockHeight);
    }

    function isAbleCompletedTransaction(bytes32 id) external view returns (bool) {
        DataTypes.TransactionData memory transactionData = transactions_data[id];
        if(transactionData.status == DataTypes.TransactionStatus.Active) {
            return true;
        } else if (transactionData.status == DataTypes.TransactionStatus.Arbitrated) {
            if(isSubmitArbitrationOutTime(transactionData)) {
                return true;
            }
        } else if (transactionData.status == DataTypes.TransactionStatus.Submitted) {
            return true;
        }

        return false;
    }

    /**
     * @notice Close a transaction that has not paid the BTC fee within the timeout period
     * @dev Only callable by the assigned arbitrator of the transaction
     * @param id The transaction ID
     */
    function closeUnpaidTransaction(bytes32 id) external override {
        DataTypes.TransactionParties memory parties = transactions_parties[id];
        // Check if caller is the assigned arbitrator
        if (msg.sender != parties.arbitrator) {
            revert(Errors.NOT_AUTHORIZED);
        }

        // Check if transaction btc fee is 0
        DataTypes.TransactionData memory transactionData = transactions_data[id];
        if (transactionData.arbitratorBtcFee == 0) {
            revert(Errors.NO_BTC_FEE);
        }

        // Check if BTC fee payment timeout has passed
        uint256 timeout = configManager.getDappBtcFeePaymentTimeout();
        if (block.timestamp <= transactionData.startTime + timeout) {
            revert(Errors.TIMEOUT_NOT_REACHED);
        }

        _completeTransaction(id, parties);

        emit TransactionClosedUnpaid(id, parties.dapp, parties.arbitrator, block.timestamp);
    }

    function isSubmitArbitrationOutTime(DataTypes.TransactionData memory transaction ) internal view returns (bool) {
        if (block.timestamp > transaction.deadline) {
            return true;
        }
        uint256 configTime = configManager.getArbitrationTimeout();
        return block.timestamp > transaction.requestArbitrationTime + configTime;
    }

     /**
     * @notice Complete a transaction with slashing mechanism
     * @dev Only callable by compensation manager when transaction is in Submitted status and past deadline
     * @param id Transaction ID
     * @param receivedCompensationAddress Address to receive the slashed transaction fee
     */
    function completeTransactionWithSlash(
        bytes32 id, 
        address receivedCompensationAddress
    ) external onlyCompensationManager {
        DataTypes.TransactionParties storage transactionParties = transactions_parties[id];
        DataTypes.TransactionData storage transactionData = transactions_data[id];
        if (transactionData.status == DataTypes.TransactionStatus.Completed) {
            revert(Errors.INVALID_TRANSACTION_STATUS);
        }
        // Validate received compensation address
        if (receivedCompensationAddress == address(0)) {
            revert(Errors.ZERO_ADDRESS);
        }
        // Update transaction status to Completed
        transactionData.status = DataTypes.TransactionStatus.Completed;
        // Transfer deposited fee to compensation address
        (bool success, ) = payable(receivedCompensationAddress).call{value: transactionData.depositedFee}("");
        if (!success) {
            revert(Errors.TRANSFER_FAILED);
        }
        // Release arbitrator from working status
        arbitratorManager.releaseArbitrator(transactionParties.arbitrator, id);

        emit TransactionCompleted(id, transactionParties.dapp);
    }

    function _completeTransaction(bytes32 id, DataTypes.TransactionParties memory parties) internal returns(uint256, uint256) {
        // Get arbitrator info and calculate duration-based fee
        (uint256 finalArbitratorFee, uint256 systemFee) = transferCompletedTransactionFee(id,parties);

        arbitratorManager.releaseArbitrator(parties.arbitrator, id);

        transactions_data[id].status = DataTypes.TransactionStatus.Completed;
        emit TransactionCompleted(id, parties.dapp);

        return (finalArbitratorFee, systemFee);
    }

    function transferCompletedTransactionFee(bytes32 id, DataTypes.TransactionParties memory parties) internal returns(uint256, uint256) {
        // Get arbitrator info and calculate duration-based fee
        DataTypes.TransactionData memory transactionData = transactions_data[id];
        uint256 duration = block.timestamp > transactionData.deadline ? transactionData.deadline - transactionData.startTime : block.timestamp - transactionData.startTime;
        uint256 arbitratorFee = arbitratorManager.getFee(duration, parties.arbitrator);
        if(arbitratorFee == 0) {
            return (0, 0);
        }
        if (arbitratorFee > transactionData.depositedFee) {
            arbitratorFee = transactionData.depositedFee;
        }

        // Calculate system fee from arbitrator's fee and get fee collector
        uint256 systemFee = (arbitratorFee * configManager.getConfig(ConfigManagerKeys.SYSTEM_FEE_RATE)) / 10000;
        uint256 finalArbitratorFee = arbitratorFee - systemFee;
        address feeCollector = configManager.getSystemFeeCollector();

        // Pay system fee to collector
        (bool success1, ) = feeCollector.call{value: systemFee}("");
        if (!success1) revert(Errors.TRANSFER_FAILED);

        // Pay arbitrator
        DataTypes.ArbitratorInfo memory arbitratorInfo = arbitratorManager.getArbitratorInfo(parties.arbitrator);
        (bool success2, ) = arbitratorInfo.revenueETHAddress.call{value: finalArbitratorFee}("");
        if (!success2) revert(Errors.TRANSFER_FAILED);

        // Refund remaining balance to DApp
        uint256 remainingBalance = transactionData.depositedFee - arbitratorFee;
        if (remainingBalance > 0) {
            (bool success3, ) = parties.depositedFeeRefundAddress.call{value: remainingBalance}("");
            if (!success3) revert(Errors.TRANSFER_FAILED);
        }
        emit DepositFeeTransfer(id, arbitratorInfo.revenueETHAddress, arbitratorFee, systemFee, remainingBalance);
        return (finalArbitratorFee, systemFee);
    }

    /**
     * @notice Handles arbitration request and validates Bitcoin transaction
     * @dev This method will:
     * - Validate transaction status and caller permissions
     * - Parse and verify Bitcoin transaction inputs against UTXOs
     * - Generate witness signature data and transaction hash
     * - Verify output scripts contain arbitrator's Bitcoin address
     * - Update transaction status to Arbitrated
     *
     * @param data Arbitration data structure containing:
     *   - id: Transaction ID
     *   - rawData: Raw Bitcoin transaction data
     *   - signDataType: Signature data type (currently only witness supported)
     *   - signHashFlag: Signature hash flag
     *   - script: Bitcoin transaction script
     *   - timeoutCompensationReceiver: Timeout compensation recipient address
     */
    function requestArbitration(
       DataTypes.ArbitrationData calldata data
    ) external override nonReentrant {
        if (data.timeoutCompensationReceiver == address(0)) {
            revert(Errors.ZERO_ADDRESS);
        }

        DataTypes.TransactionData storage transactionData = transactions_data[data.id];
        // Validate transaction status and ownership
        if (transactionData.status != DataTypes.TransactionStatus.Active) {
            revert(Errors.INVALID_TRANSACTION_STATUS);
        }
        if (block.timestamp + configManager.getArbitrationTimeout() > transactionData.deadline) {
            revert(Errors.REQUEST_ARBITRATION_OUTTIME);
        }
        // Only support witness type now
        if (data.signDataType != DataTypes.SignDataType.Witness) {
            revert(Errors.INVALID_SIGN_DATA_TYPE);
        }

        DataTypes.TransactionParties storage transactionParties = transactions_parties[data.id];
        if (msg.sender != transactionParties.dapp) {
            revert(Errors.NOT_AUTHORIZED);
        }
        DataTypes.UTXO[] storage transactionUtxos = transactions_utxos[data.id];
        if (transactionUtxos.length == 0) {
            revert(Errors.UTXO_NOT_UPLOADED);
        }

        // Parse and validate Bitcoin transaction
        IBTCUtils.BTCTransaction memory parsedTx = btcUtils.parseBTCTransaction(data.rawData);
        if(parsedTx.inputs.length != transactionUtxos.length) {
             revert(Errors.INVALID_TRANSACTION);
        }
        for(uint i = 0; i < parsedTx.inputs.length; i++) {
            if(parsedTx.inputs[i].txid != transactionUtxos[i].txHash
                || parsedTx.inputs[i].vout != transactionUtxos[i].index) {
                revert(Errors.INVALID_TRANSACTION);
            }
        }

        // Generate sign data and sign hash
        uint256 amount = transactionUtxos[0].amount;
        bytes memory signData = btcUtils.generateWitnessSignData(
             parsedTx, 0, data.script, uint64(amount), data.signHashFlag);

        bytes32 signHash = sha256(abi.encodePacked(sha256(signData)));

        // Check output script is sent to arbitrator's address
        bool isOutputOfArbitrator = false;
        string memory arbitratorAddress = arbitratorManager.getArbitratorInfo(transactionParties.arbitrator).revenueBtcAddress;
        for (uint i = 0; i < parsedTx.outputs.length; i++) {
            bytes memory decodedScript = btcAddressParser.DecodeBtcAddressToScript(arbitratorAddress);
            isOutputOfArbitrator = keccak256(parsedTx.outputs[i].scriptPubKey) == keccak256(decodedScript);
            if (isOutputOfArbitrator) {
                uint fee = amount * configManager.getArbitrationBTCFeeRate() / 10000;
                if (parsedTx.outputs[i].value < fee) {
                    revert(Errors.INVALID_OUTPUT_AMOUNT);
                }
                break;
            }
        }
        if (!isOutputOfArbitrator) {
            revert(Errors.INVALID_OUTPUT_SCRIPT);
        }

        transactionParties.timeoutCompensationReceiver = data.timeoutCompensationReceiver;
        transactionData.requestArbitrationTime = block.timestamp;
        transactionData.status = DataTypes.TransactionStatus.Arbitrated;
        transactions_sign_hash[data.id] = signHash;
        transactions_btc_raw_data[data.id] = data.rawData;
        transactions_btc_script[data.id] = data.script;
        //Store txHash to id mapping
        txHashToId[signHash] = data.id;
        // Store signData
        transactionSignData[signHash] = signData;

        emit ArbitrationRequested(data.id, transactionParties.dapp, transactionParties.arbitrator, data.rawData, data.script, transactionParties.timeoutCompensationReceiver);
    }

    /**
     * @notice Submit arbitration result
     * @param id Transaction ID
     * @param btcTxSignature Bitcoin transaction signature
     */
    function submitArbitration(
        bytes32 id,
        bytes calldata btcTxSignature
    ) external {
        DataTypes.TransactionData storage transactionData = transactions_data[id];
        DataTypes.TransactionParties storage transactionParties = transactions_parties[id];

        if (transactionData.status != DataTypes.TransactionStatus.Arbitrated) {
            revert(Errors.INVALID_TRANSACTION_STATUS);
        }

        if (isSubmitArbitrationOutTime(transactionData)) {
            revert(Errors.SUBMITTED_SIGNATURES_OUTTIME);
        }

        if (!arbitratorManager.isOperatorOf(transactionParties.arbitrator, msg.sender)) {
            revert(Errors.NOT_AUTHORIZED);
        }

        if (!btcUtils.IsValidDERSignature(btcTxSignature)) {
            revert(Errors.INVALID_DER_SIGNATURE);
        }

        transactionData.status = DataTypes.TransactionStatus.Submitted;
        transactions_btc_signature[id] = btcTxSignature;
        arbitratorManager.frozenArbitrator(transactionParties.arbitrator);

        emit ArbitrationSubmitted(id, transactionParties.dapp, msg.sender, btcTxSignature);
    }

    /**
     * @notice Get transaction by ID
     * @param id Transaction ID
     * @return Transaction struct
     */
    function getTransactionDataById(bytes32 id) external view override returns (DataTypes.TransactionData memory) {
        return transactions_data[id];
    }

    function getTransactionUTXOsById(bytes32 id) external view returns (DataTypes.UTXO[] memory) {
        return transactions_utxos[id];
    }

    function getTransactionSignatureById(bytes32 id) external view returns (bytes memory) {
        return transactions_btc_signature[id];
    }

    function getTransactionSignatureByTxHash(bytes32 txHash) external view returns (bytes memory) {
        return transactions_btc_signature[txHashToId[txHash]];
    }

    function getTransactionBtcRawDataById(bytes32 id) external view returns (bytes memory) {
        return transactions_btc_raw_data[id];
    }

    function getTransactionSignHashById(bytes32 id) external view returns (bytes32) {
        return transactions_sign_hash[id];
    }

    /**
     * @notice Get transaction by transaction hash
     * @param txHash Transaction hash
     * @return Transaction struct
     */
    function getTransactionDataByTxHash(bytes32 txHash) external view override returns (DataTypes.TransactionData memory) {
        return transactions_data[txHashToId[txHash]];
    }

    function getTransactionPartiesById(bytes32 id) external view returns (DataTypes.TransactionParties memory) {
        return transactions_parties[id];
    }

    function getTransactionPartiesByTxHash(bytes32 txHash) external view returns (DataTypes.TransactionParties memory) {
        return transactions_parties[txHashToId[txHash]];
    }

    function getTransactionStatus(bytes32 id) external view override returns (DataTypes.TransactionStatus status) {
        DataTypes.TransactionData memory transaction = transactions_data[id];
        status = transaction.status;
        if (transaction.status == DataTypes.TransactionStatus.Active && transaction.deadline < block.timestamp) {
            status = DataTypes.TransactionStatus.Expired;
        }
        if (transaction.status == DataTypes.TransactionStatus.Arbitrated && isSubmitArbitrationOutTime(transaction)) {
            status = DataTypes.TransactionStatus.Expired;
        }
        return status;
    }

    /**
    * @notice Transfer arbitration fee to arbitrator and system fee address
    * @dev Only callable by compensation manager
    * @param id Transaction ID
    * @return arbitratorFee The fee amount for arbitrator
    * @return systemFee The fee amount for system
    */
    function transferArbitrationFee(
        bytes32 id
    ) external override onlyCompensationManager returns (uint256 arbitratorFee, uint256 systemFee) {
        DataTypes.TransactionParties memory transactionParties = transactions_parties[id];
        DataTypes.TransactionData memory transaction = transactions_data[id];
        if ((transaction.status == DataTypes.TransactionStatus.Active && block.timestamp > transaction.deadline)
            || (transaction.status == DataTypes.TransactionStatus.Submitted && !arbitratorManager.isFrozenStatus(transactionParties.arbitrator))) {
            return _completeTransaction(id, transactionParties);
        } else {
            revert(Errors.INVALID_TRANSACTION_STATUS);
        }
    }

    function setArbitratorManager(address _arbitratorManager) external onlyOwner {
        arbitratorManager = IArbitratorManager(_arbitratorManager);
        emit SetArbitratorManager(_arbitratorManager);
    }

    function setBTCAddressParser(address _btcAddressParser) external onlyOwner {
        if (_btcAddressParser == address(0)) {
            revert(Errors.ZERO_ADDRESS);
        }
        btcAddressParser = IBtcAddress(_btcAddressParser);
        emit BTCAddressParserChanged(_btcAddressParser);
    }

    function setBtcBlockHeaders(address _btcBlockHeaders) external onlyOwner {
        if (_btcBlockHeaders == address(0)) {
            revert(Errors.ZERO_ADDRESS);
        }
        btcBlockHeaders = IBtcBlockHeaders(_btcBlockHeaders);
        emit BtcBlockHeadersChanged(_btcBlockHeaders);
    }

    function setBtcBlockHeaders(address _btcBlockHeaders) external onlyOwner {
        if (_btcBlockHeaders == address(0)) {
            revert(Errors.ZERO_ADDRESS);
        }
        btcBlockHeaders = IBtcBlockHeaders(_btcBlockHeaders);
        emit BtcBlockHeadersChanged(_btcBlockHeaders);
    }

    // Add a gap for future storage variables
    uint256[46] private __gap;
}
