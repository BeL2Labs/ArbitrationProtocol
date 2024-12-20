// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../interfaces/ITransactionManager.sol";
import "../interfaces/IArbitratorManager.sol";
import "../interfaces/IDAppRegistry.sol";
import "../interfaces/IConfigManager.sol";
import "../core/ConfigManager.sol";
import "../libraries/DataTypes.sol";
import "../libraries/Errors.sol";
import "../libraries/BTCUtils.sol";

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
    ConfigManager public configManager;

    // Transaction storage
    mapping(bytes32 => DataTypes.Transaction) public transactions;
    mapping(bytes32 => bytes32) public txHashToId;
    uint256 private _transactionIdCounter;

    // State variables
    address public compensationManager;
    bool private initialized;

    modifier onlyCompensationManager() {
        if (msg.sender != compensationManager) revert(Errors.NOT_COMPENSATION_MANAGER);
        if (!initialized) revert(Errors.NOT_INITIALIZED);
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract with required addresses
     * @param _arbitratorManager Address of the arbitrator manager contract
     * @param _dappRegistry Address of the DApp registry contract
     * @param _configManager Address of the config manager contract
     */
    function initialize(
        address _arbitratorManager,
        address _dappRegistry,
        address _configManager
    ) public initializer {
        __ReentrancyGuard_init();
        __Ownable_init(msg.sender);

        if (_arbitratorManager == address(0)) revert(Errors.ZERO_ADDRESS);
        if (_dappRegistry == address(0)) revert(Errors.ZERO_ADDRESS);
        if (_configManager == address(0)) revert(Errors.ZERO_ADDRESS);

        arbitratorManager = IArbitratorManager(_arbitratorManager);
        dappRegistry = IDAppRegistry(_dappRegistry);
        configManager = ConfigManager(_configManager);
    }

    /**
     * @notice Initialize the compensation manager address
     * @param _compensationManager Address of the compensation manager contract
     * @custom:security Address is checked for zero address to prevent invalid initialization
     */
    function initCompensationManager(address _compensationManager) external onlyOwner {
        if (_compensationManager == address(0)) revert(Errors.ZERO_ADDRESS);
        compensationManager = _compensationManager;
        initialized = true;
        emit CompensationManagerInitialized(_compensationManager);
    }

    /**
     * @notice Register a new transaction
     * @param arbitrator The arbitrator address
     * @param deadline The deadline for the transaction
     * @param compensationReceiver Address to receive compensation in case of timeout
     * @return id The unique transaction ID
     */
    function registerTransaction(
        address arbitrator,
        uint256 deadline,
        address compensationReceiver
    ) external payable nonReentrant returns (uint256) {
        if (arbitrator == address(0) || compensationReceiver == address(0)) {
            revert(Errors.ZERO_ADDRESS);
        }

        // Check DApp status
        if (!dappRegistry.isActiveDApp(msg.sender)) {
            revert(Errors.DAPP_NOT_ACTIVE);
        }

        // Validate arbitrator and get info
        DataTypes.ArbitratorInfo memory arbitratorInfo = arbitratorManager.getArbitratorInfo(arbitrator);
        if (!arbitratorManager.isActiveArbitrator(arbitrator))
            revert(Errors.ARBITRATOR_NOT_ACTIVE);

        // Validate deadline
        if (deadline <= block.timestamp) 
            revert(Errors.INVALID_DEADLINE);

        uint256 duration = deadline - block.timestamp;
        if (duration < configManager.getConfig(configManager.MIN_TRANSACTION_DURATION()) ||
            duration > configManager.getConfig(configManager.MAX_TRANSACTION_DURATION())) {
            revert(Errors.INVALID_DURATION);
        }

        // Calculate and validate fee
        // fee = stake * (duration / secondsPerYear) * (feeRate / feeRateMultiplier)
        uint256 fee = (arbitratorInfo.ethAmount * duration * arbitratorInfo.currentFeeRate) / (SECONDS_PER_YEAR * FEE_RATE_MULTIPLIER);
        uint256 minFeeRate = configManager.getConfig(configManager.TRANSACTION_MIN_FEE_RATE());
        if (arbitratorInfo.currentFeeRate < minFeeRate || arbitratorInfo.currentFeeRate > 10000) {
            revert(Errors.INVALID_FEE_RATE);
        }
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
        transactions[id] = DataTypes.Transaction({
            dapp: msg.sender,
            arbitrator: arbitrator,
            deadline: deadline,
            depositedFee: fee,
            startTime: 0,
            status: DataTypes.TransactionStatus.Active,
            btcTx: new bytes(0),
            signature: new bytes(0),
            btcTxHash: bytes32(0),
            compensationReceiver: compensationReceiver,
            timeoutCompensationReceiver: compensationReceiver
        });

        emit TransactionRegistered(id, msg.sender, arbitrator);
        return uint256(id);
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

        if (msg.sender != transaction.dapp) {
            revert(Errors.NOT_AUTHORIZED);
        }

        _completeTransaction(id, transaction);
    }

    function isAbleCompletedTransaction(bytes32 id) external view returns (bool) {
        DataTypes.Transaction memory transaction = transactions[id];
        if(transaction.status == DataTypes.TransactionStatus.Active) {
            return true;
        } else if (transaction.status == DataTypes.TransactionStatus.Arbitrated) {
            if(isSubmitArbitrationOutTime(transaction)) {
                return true;
            }
        } else if (transaction.status == DataTypes.TransactionStatus.Submitted) {
            return true;
        }

        return false;
    }

    function isSubmitArbitrationOutTime(DataTypes.Transaction memory transaction ) internal view returns (bool) {
        if (block.timestamp > transaction.deadline) {
            return true;
        }
        uint256 configTime = configManager.getArbitrationTimeout();
       return block.timestamp > transaction.startTime + configTime;
    }

    function _completeTransaction(bytes32 id, DataTypes.Transaction storage transaction) internal returns(uint256, uint256) {
        // Get arbitrator info and calculate duration-based fee
        uint256 finalArbitratorFee = 0;
        uint256 systemFee = 0;
       
        if (transaction.status != DataTypes.TransactionStatus.Active) {
            (finalArbitratorFee, systemFee) = transferCompletedTransactionFee(transaction);
        }
        
        // Release arbitrator from working status
        arbitratorManager.releaseArbitrator(transaction.arbitrator, id);

        transaction.status = DataTypes.TransactionStatus.Completed;
        emit TransactionCompleted(transaction.dapp, id);

        return (finalArbitratorFee, systemFee);
    }
    
    function transferCompletedTransactionFee(DataTypes.Transaction memory transaction) internal returns(uint256, uint256) {
        // Get arbitrator info and calculate duration-based fee
        DataTypes.ArbitratorInfo memory arbitratorInfo = arbitratorManager.getArbitratorInfo(transaction.arbitrator);
        if (transaction.status == DataTypes.TransactionStatus.Active) {
            revert("Can't transfer fee for active transaction");
        }
        uint256 duration = block.timestamp - transaction.startTime;
        uint256 arbitratorFee = (arbitratorInfo.ethAmount * duration * arbitratorInfo.currentFeeRate) / (SECONDS_PER_YEAR * FEE_RATE_MULTIPLIER);

        // Calculate system fee from arbitrator's fee and get fee collector
        uint256 systemFee = (arbitratorFee * configManager.getConfig(configManager.SYSTEM_FEE_RATE())) / 10000;
        uint256 finalArbitratorFee = arbitratorFee - systemFee;
        address feeCollector = configManager.getSystemFeeCollector();

        // Pay system fee to collector
        (bool success1, ) = feeCollector.call{value: systemFee}("");
        if (!success1) revert(Errors.TRANSFER_FAILED);

        // Pay arbitrator
        (bool success2, ) = arbitratorInfo.revenueETHAddress.call{value: finalArbitratorFee}("");
        if (!success2) revert(Errors.TRANSFER_FAILED);

        // Refund remaining balance to DApp
        uint256 remainingBalance = address(this).balance;
        if (remainingBalance > 0) {
            (bool success3, ) = transaction.dapp.call{value: remainingBalance}("");
            if (!success3) revert(Errors.TRANSFER_FAILED);
        }
        return (finalArbitratorFee, systemFee);
    }

    /**
     * @notice Request arbitration for a transaction
     * @param id Transaction ID
     * @param btcTx Bitcoin transaction data
     * @param timeoutCompensationReceiver Address to receive timeout compensation
     */
    function requestArbitration(
        bytes32 id,
        bytes calldata btcTx,
        address timeoutCompensationReceiver
    ) external override nonReentrant {
        if (timeoutCompensationReceiver == address(0)) {
            revert(Errors.ZERO_ADDRESS);
        }

        DataTypes.Transaction storage transaction = transactions[id];

        if (transaction.status != DataTypes.TransactionStatus.Active) {
            revert(Errors.INVALID_TRANSACTION_STATUS);
        }

        if (msg.sender != transaction.dapp) {
            revert(Errors.NOT_AUTHORIZED);
        }

        // Parse and validate Bitcoin transaction
        BTCUtils.BTCTransaction memory parsedTx = BTCUtils.parseBTCTransaction(btcTx);

        // Calculate transaction hash with empty input scripts
        bytes memory serializedTx = BTCUtils.serializeBTCTransaction(parsedTx);
        bytes32 txHash = sha256(serializedTx);

        transaction.status = DataTypes.TransactionStatus.Arbitrated;
        transaction.btcTx = btcTx;
        transaction.btcTxHash = txHash;
        transaction.startTime = block.timestamp;
        transaction.timeoutCompensationReceiver = timeoutCompensationReceiver;

        // Store txHash to id mapping
        txHashToId[txHash] = id;

        emit ArbitrationRequested(transaction.dapp, id);
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

        if (transaction.status != DataTypes.TransactionStatus.Arbitrated) {
            revert(Errors.INVALID_TRANSACTION_STATUS);
        }

        if (isSubmitArbitrationOutTime(transaction)) {
            revert(Errors.SUBMITTED_SIGNATURES_OUTTIME);
        }

        if (!arbitratorManager.isOperatorOf(transaction.arbitrator, msg.sender)) {
            revert(Errors.NOT_AUTHORIZED);
        }

        transaction.status = DataTypes.TransactionStatus.Submitted;
        transaction.signature = btcTxSignature;

        emit ArbitrationSubmitted(transaction.dapp, id);
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
        bytes32 id = txHashToId[txHash];
        if (id == bytes32(0)) {
            revert(Errors.TRANSACTION_NOT_FOUND);
        }
        return transactions[id];
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
        return _completeTransaction(id, transaction);
    }

    // Add a gap for future storage variables
    uint256[50] private __gap;
}
