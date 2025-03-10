// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IConfigManager {
    // Stake related configurations
    function setMinStake(uint256 amount) external;
    function setMaxStake(uint256 amount) external;
    function setMinStakeLockedTime(uint256 time) external;
    
    // Time related configurations
    function setMinTransactionDuration(uint256 duration) external;
    function setMaxTransactionDuration(uint256 duration) external;
    function setArbitrationTimeout(uint256 timeout) external;
    function getArbitrationTimeout() external view returns (uint256);
    
    // Fee related configurations
    function setTransactionMinFeeRate(uint256 rate) external;
    function setTransactionMinBTCFeeRate(uint256 feeRate) external;
    
    // Arbitrator related configurations
    function setArbitrationFrozenPeriod(uint256 period) external;
    function getArbitrationFrozenPeriod() external view returns (uint256);
    function setSystemFeeRate(uint256 rate) external;
    function getSystemFeeRate() external view returns (uint256);
    
    // System fee collector related configurations
    /**
     * @notice Set system fee collector
     * @param collector Address of the system fee collector
     */
    function setSystemFeeCollector(address collector) external;

    /**
     * @notice Get system fee collector address
     * @return Address of the system fee collector
     */
    function getSystemFeeCollector() external view returns (address);

    // Query configurations
    function getConfig(bytes32 key) external view returns (uint256);
    function getAllConfigs() external view returns (bytes32[] memory keys, uint256[] memory values);
    
    /**
     * @notice Set multiple configs at once
     * @param keys Array of config keys
     * @param values Array of config values
     */
    function setConfigs(bytes32[] calldata keys, uint256[] calldata values) external;
    
    // System compensation fee rate
    function getSystemCompensationFeeRate() external view returns (uint256);
    function setSystemCompensationFeeRate(uint256 rate) external;
    function getArbitrationBTCFeeRate() external view returns (uint256);
    
    /**
     * @notice Emitted when a config value is updated
     * @param key Config key
     * @param oldValue Old config value
     * @param newValue New config value
     */
    event ConfigUpdated(bytes32 indexed key, uint256 oldValue, uint256 newValue);
}