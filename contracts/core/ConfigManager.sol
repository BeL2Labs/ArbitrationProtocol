// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../interfaces/IConfigManager.sol";
import "../libraries/Errors.sol";
import "../libraries/DataTypes.sol";
import "../libraries/ConfigManagerKeys.sol";

/**
 * @title ConfigManager
 * @notice Manages configuration parameters for the BeLayer2 arbitration protocol
 */
contract ConfigManager is IConfigManager, OwnableUpgradeable {
    // Configuration storage
    mapping(bytes32 => uint256) private configs;

    // Config keys
    bytes32 public constant MIN_STAKE = ConfigManagerKeys.MIN_STAKE;
    bytes32 public constant MAX_STAKE =ConfigManagerKeys.MAX_STAKE;
    bytes32 public constant MIN_STAKE_LOCKED_TIME = ConfigManagerKeys.MIN_STAKE_LOCKED_TIME;
    bytes32 public constant MIN_TRANSACTION_DURATION = ConfigManagerKeys.MIN_TRANSACTION_DURATION;
    bytes32 public constant MAX_TRANSACTION_DURATION = ConfigManagerKeys.MAX_TRANSACTION_DURATION;
    bytes32 public constant TRANSACTION_MIN_FEE_RATE = ConfigManagerKeys.TRANSACTION_MIN_FEE_RATE;
    bytes32 public constant ARBITRATION_TIMEOUT = ConfigManagerKeys.ARBITRATION_TIMEOUT;
    bytes32 public constant ARBITRATION_FROZEN_PERIOD = ConfigManagerKeys.ARBITRATION_FROZEN_PERIOD;
    bytes32 public constant SYSTEM_FEE_RATE = ConfigManagerKeys.SYSTEM_FEE_RATE;
    bytes32 public constant SYSTEM_COMPENSATION_FEE_RATE = ConfigManagerKeys.SYSTEM_COMPENSATION_FEE_RATE;
    bytes32 public constant SYSTEM_FEE_COLLECTOR = ConfigManagerKeys.SYSTEM_FEE_COLLECTOR;
    bytes32 public constant ARBITRATION_BTC_FEE_RATE = ConfigManagerKeys.ARBITRATION_BTC_FEE_RATE;

    ///@custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    /**
     * @notice Initialize the contract with default configuration values
     */
    function initialize() initializer public virtual {
        __Ownable_init(msg.sender);

        // Set default values
        configs[MIN_STAKE] = 1 ether;
        configs[MAX_STAKE] = 100 ether;
        configs[MIN_STAKE_LOCKED_TIME] = 7 days;
        configs[MIN_TRANSACTION_DURATION] = 1 days;
        configs[MAX_TRANSACTION_DURATION] = 30 days;
        configs[TRANSACTION_MIN_FEE_RATE] = 100; // 1% in basis points
        configs[ARBITRATION_TIMEOUT] = 24 hours; //Deadline for submitting signatures
        configs[ARBITRATION_FROZEN_PERIOD] = 30 minutes;//The freezing period after the end of the transaction, during which transaction cannot be accepted or exited
        configs[SYSTEM_FEE_RATE] = 500; // 5% in basis points
        configs[SYSTEM_COMPENSATION_FEE_RATE] = 200; // 2% in basis points
        configs[ARBITRATION_BTC_FEE_RATE] = 1000;// 0.1% in basis points
    }

    /**
     * @notice Set minimum stake amount
     * @param amount Minimum stake amount in wei
     */
    function setMinStake(uint256 amount) external onlyOwner {
        if (amount >= configs[MAX_STAKE]) revert("MIN_STAKE_EXCEEDS_MAX");
        uint256 oldValue = configs[MIN_STAKE];
        configs[MIN_STAKE] = amount;
        emit ConfigUpdated(MIN_STAKE, oldValue, amount);
    }

    /**
     * @notice Set maximum stake amount
     * @param amount Maximum stake amount in wei
     */
    function setMaxStake(uint256 amount) external override onlyOwner {
        if (amount <= configs[MIN_STAKE]) revert("MAX_STAKE_BELOW_MIN");
        uint256 oldValue = configs[MAX_STAKE];
        configs[MAX_STAKE] = amount;
        emit ConfigUpdated(MAX_STAKE, oldValue, amount);
    }

    /**
     * @notice Set minimum stake locked time
     * @param time Minimum time in seconds
     */
    function setMinStakeLockedTime(uint256 time) external onlyOwner {
        uint256 oldValue = configs[MIN_STAKE_LOCKED_TIME];
        configs[MIN_STAKE_LOCKED_TIME] = time;
        emit ConfigUpdated(MIN_STAKE_LOCKED_TIME, oldValue, time);
    }

    /**
     * @notice Set minimum transaction duration
     * @param duration Minimum duration in seconds
     */
    function setMinTransactionDuration(uint256 duration) external onlyOwner {
        if (duration >= configs[MAX_TRANSACTION_DURATION]) revert("MIN_DURATION_EXCEEDS_MAX");
        uint256 oldValue = configs[MIN_TRANSACTION_DURATION];
        configs[MIN_TRANSACTION_DURATION] = duration;
        emit ConfigUpdated(MIN_TRANSACTION_DURATION, oldValue, duration);
    }

    /**
     * @notice Set maximum transaction duration
     * @param duration Maximum duration in seconds
     */
    function setMaxTransactionDuration(uint256 duration) external onlyOwner {
        if (duration <= configs[MIN_TRANSACTION_DURATION]) revert("MAX_DURATION_BELOW_MIN");
        uint256 oldValue = configs[MAX_TRANSACTION_DURATION];
        configs[MAX_TRANSACTION_DURATION] = duration;
        emit ConfigUpdated(MAX_TRANSACTION_DURATION, oldValue, duration);
    }

    /**
     * @notice Set transaction minimum fee rate
     * @param rate Minimum fee rate in basis points
     */
    function setTransactionMinFeeRate(uint256 rate) external onlyOwner {
        uint256 oldValue = configs[TRANSACTION_MIN_FEE_RATE];
        configs[TRANSACTION_MIN_FEE_RATE] = rate;
        emit ConfigUpdated(TRANSACTION_MIN_FEE_RATE, oldValue, rate);
    }

    /**
     * @notice Set arbitration timeout
     * @param timeout Timeout duration in seconds
     */
    function setArbitrationTimeout(uint256 timeout) external onlyOwner {
        uint256 oldValue = configs[ARBITRATION_TIMEOUT];
        configs[ARBITRATION_TIMEOUT] = timeout;
        emit ConfigUpdated(ARBITRATION_TIMEOUT, oldValue, timeout);
    }

    /**
     * @notice Set arbitration frozen period
     * @param period Frozen period in seconds
     */
    function setArbitrationFrozenPeriod(uint256 period) external onlyOwner {
        uint256 oldValue = configs[ARBITRATION_FROZEN_PERIOD];
        configs[ARBITRATION_FROZEN_PERIOD] = period;
        emit ConfigUpdated(ARBITRATION_FROZEN_PERIOD, oldValue, period);
    }

    /**
     * @notice Set system fee rate
     * @param rate Fee rate in basis points
     */
    function setSystemFeeRate(uint256 rate) external override onlyOwner {
        uint256 oldValue = configs[SYSTEM_FEE_RATE];
        configs[SYSTEM_FEE_RATE] = rate;
        emit ConfigUpdated(SYSTEM_FEE_RATE, oldValue, rate);
    }

    /**
     * @notice Set system compensation fee rate
     * @param rate New system compensation fee rate in basis points
     */
    function setSystemCompensationFeeRate(uint256 rate) external override onlyOwner {
        uint256 oldValue = configs[SYSTEM_COMPENSATION_FEE_RATE];
        configs[SYSTEM_COMPENSATION_FEE_RATE] = rate;
        emit ConfigUpdated(SYSTEM_COMPENSATION_FEE_RATE, oldValue, rate);
    }

    /**
     * @notice Set system fee collector
     * @param collector Address of the system fee collector
     */
    function setSystemFeeCollector(address collector) external override onlyOwner {
        if (collector == address(0)) revert (Errors.ZERO_ADDRESS);
        uint256 oldValue = configs[SYSTEM_FEE_COLLECTOR];
        configs[SYSTEM_FEE_COLLECTOR] = uint256(uint160(collector));
        emit ConfigUpdated(SYSTEM_FEE_COLLECTOR, oldValue, uint256(uint160(collector)));
    }

    /**
     * @notice Set multiple configs at once
     * @param keys Array of config keys
     * @param values Array of config values
     */
    function setConfigs(bytes32[] calldata keys, uint256[] calldata values) external onlyOwner {
        if (keys.length != values.length) revert (Errors.LENGTH_MISMATCH);
        
        for (uint256 i = 0; i < keys.length; i++) {
            uint256 oldValue = configs[keys[i]];
            configs[keys[i]] = values[i];
            emit ConfigUpdated(keys[i], oldValue, values[i]);
        }
    }

    /**
     * @notice Get a specific config value
     * @param key Config key
     * @return uint256 Config value
     */
    function getConfig(bytes32 key) external view returns (uint256) {
        return configs[key];
    }

    /**
     * @notice Get all config keys and values
     * @return keys Array of config keys
     * @return values Array of config values
     */
    function getAllConfigs() external view returns (bytes32[] memory keys, uint256[] memory values) {
        keys = new bytes32[](12);
        values = new uint256[](12);

        keys[0] = MIN_STAKE;
        keys[1] = MAX_STAKE;
        keys[2] = MIN_STAKE_LOCKED_TIME;
        keys[3] = MIN_TRANSACTION_DURATION;
        keys[4] = MAX_TRANSACTION_DURATION;
        keys[5] = TRANSACTION_MIN_FEE_RATE;
        keys[6] = ARBITRATION_TIMEOUT;
        keys[7] = ARBITRATION_FROZEN_PERIOD;
        keys[8] = SYSTEM_FEE_RATE;
        keys[9] = SYSTEM_COMPENSATION_FEE_RATE;
        keys[10] = SYSTEM_FEE_COLLECTOR;
        keys[11] = ARBITRATION_BTC_FEE_RATE;

        for (uint256 i = 0; i < keys.length; i++) {
            values[i] = configs[keys[i]];
        }

        return (keys, values);
    }

    /**
     * @notice Get arbitration frozen period
     * @return Frozen period in seconds
     */
    function getArbitrationFrozenPeriod() external view override returns (uint256) {
        return configs[ARBITRATION_FROZEN_PERIOD];
    }

    /**
     * @notice Get system fee rate
     * @return Fee rate (base 10000)
     */
    function getSystemFeeRate() external view override returns (uint256) {
        return configs[SYSTEM_FEE_RATE];
    }

    /**
     * @notice Get system compensation fee rate
     * @return System compensation fee rate in basis points
     */
    function getSystemCompensationFeeRate() external view override returns (uint256) {
        return configs[SYSTEM_COMPENSATION_FEE_RATE];
    }

    /**
     * @notice Get system fee collector address
     * @return Address of the system fee collector
     */
    function getSystemFeeCollector() external view returns (address) {
        uint256 collector = configs[SYSTEM_FEE_COLLECTOR];
        if (collector == 0) {
            return owner();  // Default to contract owner if not set
        }
        return address(uint160(collector));
    }

    /**
     * @notice Get arbitration timeout Deadline for submitting signatures
     * @return Timeout duration in seconds
     */
    function getArbitrationTimeout() external view returns (uint256) {
        return configs[ARBITRATION_TIMEOUT];
    }

    /**
     * @notice Set arbitration BTC fee rate
     * @param feeRate Fee rate in basis points
     */
    function setArbitrationBTCFeeRate(uint256 feeRate) external onlyOwner {
        uint256 oldValue = configs[ARBITRATION_BTC_FEE_RATE];
        configs[ARBITRATION_BTC_FEE_RATE] = feeRate;
        emit ConfigUpdated(ARBITRATION_BTC_FEE_RATE, oldValue, feeRate);
    }

    /**
     * @notice Get arbitration BTC fee rate
     * @return Fee rate in basis points
     */
    function getArbitrationBTCFeeRate() external view returns (uint256) {
        return configs[ARBITRATION_BTC_FEE_RATE];
    }

    // Add a gap for future storage variables
    uint256[50] private __gap;
}
