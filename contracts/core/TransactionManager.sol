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
import "../core/ConfigManager.sol";
import "../libraries/DataTypes.sol";
import "../libraries/Errors.sol";

/**
 * @title TransactionManager
 * @notice Manages transaction lifecycle in the BeLayer2 arbitration protocol
 */
contract TransactionManager is 
    ITransactionManager, 
    ReentrancyGuardUpgradeable, 
    OwnableUpgradeable 
{
    // Constants
    uint256 private constant SECONDS_PER_YEAR = 365 days;
    uint256 private constant FEE_RATE_MULTIPLIER = 10000;

    // Contract references
    IArbitratorManager public arbitratorManager;
    IDAppRegistry public dappRegistry;
    IConfigManager public configManager;
    IBTCUtils public btcUtils;

    // Transaction storage
    mapping(bytes32 => DataTypes.Transaction) public transactions;
    mapping(bytes32 => bytes32) public txHashToId;
    uint256 private _transactionIdCounter;

    // State variables
    address public compensationManager;
    IBtcAddress public btcAddressParser;
    // key is the transaction signhash
    mapping(bytes32 => bytes) public transactionSignData;

    modifier onlyCompensationManager() {
        if (msg.sender != compensationManager) revert(Errors.NOT_COMPENSATION_MANAGER);
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(
        address _btcUtils
    ) {
        btcUtils = IBTCUtils(_btcUtils);
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract with required addresses
     * @param _arbitratorManager Address of the arbitrator manager contract
     * @param _dappRegistry Address of the DApp registry contract
     * @param _configManager Address of the config manager contract
     * @param _compensationManager Address of the compensation manager contract
     */
    function initialize(
        address _arbitratorManager,
        address _dappRegistry,
        address _configManager,
        address _compensationManager
    ) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init(msg.sender);

        if (_arbitratorManager == address(0)
            || _dappRegistry == address(0)
            || _configManager == address(0)
            || _compensationManager == address(0)) revert(Errors.ZERO_ADDRESS);

        arbitratorManager = IArbitratorManager(_arbitratorManager);
        dappRegistry = IDAppRegistry(_dappRegistry);
        configManager = ConfigManager(_configManager);
        compensationManager = _compensationManager;
    }

    /**
     * @notice Register a new transaction
     * @param arbitrator The arbitrator address
     * @param deadline The deadline for the transaction
     * @param compensationReceiver Address to receive compensation in case of timeout
     * @param refundAddress Address to receive refund
     * @return id The unique transaction ID
     */
    function registerTransaction(
        address arbitrator,
        uint256 deadline,
        address compensationReceiver,
        address refundAddress
    ) external payable nonReentrant returns (bytes32) {
        if (arbitrator == address(0) || compensationReceiver == address(0) || refundAddress == address(0)) {
            revert(Errors.ZERO_ADDRESS);
        }

        // Check DApp status
        if (!dappRegistry.isActiveDApp(msg.sender)) {
            revert(Errors.DAPP_NOT_ACTIVE);
        }

        // Validate arbitrator
        if (!arbitratorManager.isActiveArbitrator(arbitrator))
            revert(Errors.ARBITRATOR_NOT_ACTIVE);

        // Validate deadline
        if (deadline <= block.timestamp)
            revert(Errors.INVALID_DEADLINE);
        uint256 duration = deadline - block.timestamp;
        if (duration < configManager.getConfig(ConfigManagerKeys.MIN_TRANSACTION_DURATION) ||
            duration > configManager.getConfig(ConfigManagerKeys.MAX_TRANSACTION_DURATION)) {
            revert(Errors.INVALID_DURATION);
        }

        // Calculate and validate fee
        // fee = stake * (duration / secondsPerYear) * (feeRate / feeRateMultiplier)
        uint256 fee = this.getRegisterTransactionFee(deadline, arbitrator);
   
        if (fee == 0) revert(Errors.INVALID_FEE);
        if (msg.value < fee) revert(Errors.INSUFFICIENT_FEE);

        // Generate transaction ID
        bytes32 id = keccak256(
            abi.encodePacked(
                block.timestamp,
                msg.sender,
                arbitrator,
                _transactionIdCounter++
            )
        );

        // Set arbitrator to working status
        arbitratorManager.setArbitratorWorking(arbitrator, id);

        // Store transaction
        DataTypes.Transaction storage transaction = transactions[id];
        transaction.basicInfo.dapp = msg.sender;
        transaction.basicInfo.arbitrator = arbitrator;
        transaction.statusInfo.startTime = block.timestamp;
        transaction.statusInfo.deadline = deadline;
        transaction.statusInfo.status = DataTypes.TransactionStatus.Active;
        transaction.basicInfo.depositedFee = msg.value;
        transaction.basicInfo.compensationReceiver = compensationReceiver;
        transaction.basicInfo.depositedFeeRefundAddress = refundAddress;

        emit TransactionRegistered(id, msg.sender, arbitrator, deadline, msg.value, compensationReceiver);
        return id;
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

        DataTypes.Transaction storage transaction = transactions[id];
        if (transaction.statusInfo.status != DataTypes.TransactionStatus.Active) {
            revert(Errors.INVALID_TRANSACTION_STATUS);
        }

        if (msg.sender != transaction.basicInfo.dapp) {
            revert(Errors.NOT_AUTHORIZED);
        }

        if (transaction.btcInfo.utxos.length != 0) {
            revert(Errors.UTXO_ALREADY_UPLOADED);
        }

        for (uint i = 0; i < utxos.length; i++) {
            transaction.btcInfo.utxos.push(utxos[i]);
        }

        emit UTXOsUploaded(id, msg.sender);
    }

    /**
     * @notice Complete a transaction
     * @param id Transaction ID
     */
    function completeTransaction(bytes32 id) external {
        DataTypes.Transaction storage transaction = transactions[id];
        if (!this.isAbleCompletedTransaction(id)) {
            revert(Errors.CANNOT_COMPLETE_TRANSACTION);
        }

        if (msg.sender != transaction.basicInfo.dapp) {
            revert(Errors.NOT_AUTHORIZED);
        }

        _completeTransaction(id, transaction);
    }

    function isAbleCompletedTransaction(bytes32 id) external view returns (bool) {
        DataTypes.Transaction memory transaction = transactions[id];
        if(transaction.statusInfo.status == DataTypes.TransactionStatus.Active) {
            return true;
        } else if (transaction.statusInfo.status == DataTypes.TransactionStatus.Arbitrated) {
            if(isSubmitArbitrationOutTime(transaction)) {
                return true;
            }
        } else if (transaction.statusInfo.status == DataTypes.TransactionStatus.Submitted) {
            return true;
        }

        return false;
    }

    function isSubmitArbitrationOutTime(DataTypes.Transaction memory transaction ) internal view returns (bool) {
        if (block.timestamp > transaction.statusInfo.deadline) {
            return true;
        }
        uint256 configTime = configManager.getArbitrationTimeout();
        return block.timestamp > transaction.statusInfo.requestArbitrationTime + configTime;
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
        DataTypes.Transaction storage transaction = transactions[id];

        if (transaction.statusInfo.status == DataTypes.TransactionStatus.Completed) {
            revert(Errors.INVALID_TRANSACTION_STATUS);
        }
        // Validate received compensation address
        if (receivedCompensationAddress == address(0)) {
            revert(Errors.ZERO_ADDRESS);
        }
        // Update transaction status to Completed
        transaction.statusInfo.status = DataTypes.TransactionStatus.Completed;
        // Transfer deposited fee to compensation address
        (bool success, ) = payable(receivedCompensationAddress).call{value: transaction.basicInfo.depositedFee}("");
        if (!success) {
            revert(Errors.TRANSFER_FAILED);
        }
        // Release arbitrator from working status
        arbitratorManager.releaseArbitrator(transaction.basicInfo.arbitrator, id);

        emit TransactionCompleted(id, transaction.basicInfo.dapp);
    }

    function _completeTransaction(bytes32 id, DataTypes.Transaction storage transaction) internal returns(uint256, uint256) {
        // Get arbitrator info and calculate duration-based fee
        (uint256 finalArbitratorFee, uint256 systemFee) = transferCompletedTransactionFee(id,transaction);
        
        // Release arbitrator from working status
        arbitratorManager.releaseArbitrator(transaction.basicInfo.arbitrator, id);

        transaction.statusInfo.status = DataTypes.TransactionStatus.Completed;
        emit TransactionCompleted(id, transaction.basicInfo.dapp);

        return (finalArbitratorFee, systemFee);
    }
    
    function transferCompletedTransactionFee(bytes32 id, DataTypes.Transaction memory transaction) internal returns(uint256, uint256) {
        // Get arbitrator info and calculate duration-based fee
        DataTypes.ArbitratorInfo memory arbitratorInfo = arbitratorManager.getArbitratorInfo(transaction.basicInfo.arbitrator);

        uint256 duration = block.timestamp > transaction.statusInfo.deadline ? transaction.statusInfo.deadline - transaction.statusInfo.startTime : block.timestamp - transaction.statusInfo.startTime;
        uint256 arbitratorFee = _getFee(transaction.basicInfo.arbitrator, arbitratorInfo.currentFeeRate, duration);
        if (arbitratorFee > transaction.basicInfo.depositedFee) {
            arbitratorFee = transaction.basicInfo.depositedFee;
        }

        // Calculate system fee from arbitrator's fee and get fee collector
        uint256 systemFee = (arbitratorFee * configManager.getConfig(ConfigManagerKeys.SYSTEM_FEE_RATE)) / 10000;
        uint256 finalArbitratorFee = arbitratorFee - systemFee;
        address feeCollector = configManager.getSystemFeeCollector();

        // Pay system fee to collector
        (bool success1, ) = feeCollector.call{value: systemFee}("");
        if (!success1) revert(Errors.TRANSFER_FAILED);

        // Pay arbitrator
        (bool success2, ) = arbitratorInfo.revenueETHAddress.call{value: finalArbitratorFee}("");
        if (!success2) revert(Errors.TRANSFER_FAILED);

        // Refund remaining balance to DApp
        uint256 remainingBalance = transaction.basicInfo.depositedFee - arbitratorFee;
        if (remainingBalance > 0) {
            (bool success3, ) = transaction.basicInfo.depositedFeeRefundAddress.call{value: remainingBalance}("");
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

        DataTypes.Transaction storage transaction = transactions[data.id];

         // Validate transaction status and ownership
         if (transaction.statusInfo.status != DataTypes.TransactionStatus.Active) {
             revert(Errors.INVALID_TRANSACTION_STATUS);
         }
         if (msg.sender != transaction.basicInfo.dapp) {
             revert(Errors.NOT_AUTHORIZED);
         }
         if (transaction.btcInfo.utxos.length == 0) {
             revert(Errors.UTXO_NOT_UPLOADED);
         }

         if (block.timestamp + configManager.getArbitrationTimeout() > transaction.statusInfo.deadline) {
             revert(Errors.REQUEST_ARBITRATION_OUTTIME);
         }

        // Only support witness type now
         if (data.signDataType != DataTypes.SignDataType.Witness) {
             revert(Errors.INVALID_SIGN_DATA_TYPE);
         }

        // Parse and validate Bitcoin transaction
         IBTCUtils.BTCTransaction memory parsedTx = btcUtils.parseBTCTransaction(data.rawData);
         if(parsedTx.inputs.length != transaction.btcInfo.utxos.length) {
             revert(Errors.INVALID_TRANSACTION);
         }
         for(uint i = 0; i < parsedTx.inputs.length; i++) {
             if(parsedTx.inputs[i].txid != transaction.btcInfo.utxos[i].txHash
                 || parsedTx.inputs[i].vout != transaction.btcInfo.utxos[i].index) {
                 revert(Errors.INVALID_TRANSACTION);
             }
         }

         // Generate sign data and sign hash
         uint256 amount = transaction.btcInfo.utxos[0].amount;
         bytes memory signData = btcUtils.generateWitnessSignData(
             parsedTx, 0, data.script, uint64(amount), data.signHashFlag);

         bytes32 signHash = sha256(abi.encodePacked(sha256(signData)));

         // Check output script is sent to arbitrator's address
         bool isOutputOfArbitrator = false;
         string memory arbitratorAddress = arbitratorManager.getArbitratorInfo(transaction.basicInfo.arbitrator).revenueBtcAddress;
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

         transaction.statusInfo.status = DataTypes.TransactionStatus.Arbitrated;
         transaction.btcInfo.btcTx = data.rawData;
         transaction.btcInfo.btcTxHash = signHash;
         transaction.basicInfo.timeoutCompensationReceiver = data.timeoutCompensationReceiver;
         transaction.btcInfo.script = data.script;
         transaction.statusInfo.requestArbitrationTime = block.timestamp;
//         Store txHash to id mapping
         txHashToId[signHash] = data.id;
         // Store signData
         transactionSignData[signHash] = signData;

        emit ArbitrationRequested(data.id, transaction.basicInfo.dapp, transaction.basicInfo.arbitrator, data.rawData, data.script, data.timeoutCompensationReceiver);
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
        DataTypes.Transaction storage transaction = transactions[id];

        if (transaction.statusInfo.status != DataTypes.TransactionStatus.Arbitrated) {
            revert(Errors.INVALID_TRANSACTION_STATUS);
        }

        if (isSubmitArbitrationOutTime(transaction)) {
            revert(Errors.SUBMITTED_SIGNATURES_OUTTIME);
        }

        if (!arbitratorManager.isOperatorOf(transaction.basicInfo.arbitrator, msg.sender)) {
            revert(Errors.NOT_AUTHORIZED);
        }

        if (!btcUtils.IsValidDERSignature(btcTxSignature)) {
            revert(Errors.INVALID_DER_SIGNATURE);
        }

        transaction.statusInfo.status = DataTypes.TransactionStatus.Submitted;
        transaction.btcInfo.signature = btcTxSignature;
        arbitratorManager.frozenArbitrator(transaction.basicInfo.arbitrator);

        emit ArbitrationSubmitted(id, transaction.basicInfo.dapp, msg.sender, btcTxSignature);
    }

    /**
     * @notice Get transaction by ID
     * @param id Transaction ID
     * @return Transaction struct
     */
    function getTransactionById(bytes32 id) external view override returns (DataTypes.Transaction memory) {
        return transactions[id];
    }

    /**
     * @notice Get transaction by transaction hash
     * @param txHash Transaction hash
     * @return Transaction struct
     */
    function getTransaction(bytes32 txHash) external view override returns (DataTypes.Transaction memory) {
        return transactions[txHashToId[txHash]];
    }

    function getTransactionStatus(bytes32 id) external view override returns (DataTypes.TransactionStatus status) {
        DataTypes.Transaction memory transaction = transactions[id];
        status = transaction.statusInfo.status;
        if (status == DataTypes.TransactionStatus.Active && transaction.statusInfo.deadline < block.timestamp) {
            status = DataTypes.TransactionStatus.Expired;
        }
        if (status == DataTypes.TransactionStatus.Arbitrated && isSubmitArbitrationOutTime(transaction)) {
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
        DataTypes.Transaction storage transaction = transactions[id];
        if ((transaction.statusInfo.status == DataTypes.TransactionStatus.Active && block.timestamp > transaction.statusInfo.deadline)
            || (transaction.statusInfo.status == DataTypes.TransactionStatus.Submitted && !arbitratorManager.isFrozenStatus(transaction.basicInfo.arbitrator))) {
            return _completeTransaction(id, transaction);
        } else {
            revert(Errors.INVALID_TRANSACTION_STATUS);
        }
    }

    /**
     * @notice Get the register transaction fee based on the deadline
     * @param deadline The deadline for the transaction
     * @return fee The calculated fee
     */
    function getRegisterTransactionFee(uint256 deadline, address arbitrator) external view returns (uint256 fee) {
        // Calculate the duration from now to the deadline
        uint256 duration = deadline > block.timestamp ? deadline - block.timestamp : 0;
        if (duration < configManager.getConfig(ConfigManagerKeys.MIN_TRANSACTION_DURATION) ||
            duration > configManager.getConfig(ConfigManagerKeys.MAX_TRANSACTION_DURATION)) {
            revert(Errors.INVALID_DURATION);
        }

        if (arbitrator == address(0)) {
            revert(Errors.ZERO_ADDRESS);
        }
        DataTypes.ArbitratorInfo memory arbitratorInfo = arbitratorManager.getArbitratorInfo(arbitrator);

        return _getFee(arbitrator, arbitratorInfo.currentFeeRate, duration);
    }

    function _getFee(address arbitrator, uint256 arbitratorFeeRate, uint256 duration) internal view returns (uint256) {
        // Calculate and validate fee
        // fee = stake * (duration / secondsPerYear) * (feeRate / feeRateMultiplier)
        uint256 totalStake = arbitratorManager.getAvailableStake(arbitrator);
        return (totalStake * duration * arbitratorFeeRate) / (SECONDS_PER_YEAR * FEE_RATE_MULTIPLIER);
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

    // Add a gap for future storage variables
    uint256[48] private __gap;
}
