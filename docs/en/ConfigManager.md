# Configuration Manager (ConfigManager)

## Overview
ConfigManager is responsible for managing various configuration parameters of the BeLayer2 arbitration protocol, including staking requirements, time limits, and fee rates. All configuration changes must be executed by the contract owner.

## Core Functions

### Stake Related Configurations

```solidity
function setMinStake(uint256 amount) external;
function setMaxStake(uint256 amount) external;
function setMinStakeLockedTime(uint256 time) external;
```
- `setMinStake`: Set minimum stake amount (default: 1 ETH)
- `setMaxStake`: Set maximum stake amount (default: 100 ETH)
- `setMinStakeLockedTime`: Set minimum stake lock time (default: 7 days)

### Time Related Configurations

```solidity
function setMinTransactionDuration(uint256 duration) external;
function setMaxTransactionDuration(uint256 duration) external;
function setArbitrationTimeout(uint256 timeout) external;
function getArbitrationTimeout() external view returns (uint256);
```
- `setMinTransactionDuration`: Set minimum transaction duration (default: 1 day)
- `setMaxTransactionDuration`: Set maximum transaction duration (default: 30 days)
- `setArbitrationTimeout`: Set arbitration timeout, the deadline for submitting signatures (default: 24 hours)
- `getArbitrationTimeout`: Get current arbitration timeout

### Fee Related Configurations

```solidity
function setTransactionMinFeeRate(uint256 rate) external;
function setSystemFeeRate(uint256 rate) external;
function getSystemFeeRate() external view returns (uint256);
function setSystemCompensationFeeRate(uint256 rate) external;
function getSystemCompensationFeeRate() external view returns (uint256);
function getArbitrationBTCFeeRate() external view returns (uint256);
```
- `setTransactionMinFeeRate`: Set minimum transaction fee rate (default: 1%, expressed in basis points, 100 = 1%)
- `setSystemFeeRate`: Set system fee rate (default: 5%, expressed in basis points, 500 = 5%)
- `getSystemFeeRate`: Get current system fee rate
- `setSystemCompensationFeeRate`: Set system compensation fee rate (default: 2%, expressed in basis points, 200 = 2%)
- `getSystemCompensationFeeRate`: Get current system compensation fee rate
- `getArbitrationBTCFeeRate`: Get arbitration BTC fee rate

### Arbitration Related Configurations

```solidity
function setArbitrationFrozenPeriod(uint256 period) external;
function getArbitrationFrozenPeriod() external view returns (uint256);
```
- `setArbitrationFrozenPeriod`: Set arbitration frozen period, the time after transaction completion during which arbitrators cannot accept or exit (default: 30 minutes)
- `getArbitrationFrozenPeriod`: Get current arbitration frozen period

### System Fee Collector Configuration

```solidity
function setSystemFeeCollector(address collector) external;
function getSystemFeeCollector() external view returns (address);
```
- `setSystemFeeCollector`: Set system fee collector address
- `getSystemFeeCollector`: Get current system fee collector address

### General Configuration Management

```solidity
function getConfig(bytes32 key) external view returns (uint256);
function getAllConfigs() external view returns (bytes32[] memory keys, uint256[] memory values);
function setConfigs(bytes32[] calldata keys, uint256[] calldata values) external;
```
- `getConfig`: Get specific configuration value by key
- `getAllConfigs`: Get all configuration key-value pairs
- `setConfigs`: Batch set multiple configuration items

### Configuration Key Constants

```solidity
bytes32 public constant MIN_STAKE = keccak256("MIN_STAKE");
bytes32 public constant MAX_STAKE = keccak256("MAX_STAKE");
bytes32 public constant MIN_STAKE_LOCKED_TIME = keccak256("MIN_STAKE_LOCKED_TIME");
bytes32 public constant MIN_TRANSACTION_DURATION = keccak256("MIN_TRANSACTION_DURATION");
bytes32 public constant MAX_TRANSACTION_DURATION = keccak256("MAX_TRANSACTION_DURATION");
bytes32 public constant TRANSACTION_MIN_FEE_RATE = keccak256("TRANSACTION_MIN_FEE_RATE");
bytes32 public constant ARBITRATION_TIMEOUT = keccak256("ARBITRATION_TIMEOUT");
bytes32 public constant ARBITRATION_FROZEN_PERIOD = keccak256("arbitrationFrozenPeriod");
bytes32 public constant SYSTEM_FEE_RATE = keccak256("systemFeeRate");
bytes32 public constant SYSTEM_COMPENSATION_FEE_RATE = keccak256("SYSTEM_COMPENSATION_FEE_RATE");
bytes32 public constant SYSTEM_FEE_COLLECTOR = keccak256("SYSTEM_FEE_COLLECTOR");
bytes32 public constant ARBITRATION_BTC_FEE_RATE = keccak256("ARBITRATION_BTC_FEE_RATE");
```

### Events

```solidity
event ConfigUpdated(
    bytes32 indexed key,  // Configuration key
    uint256 oldValue,     // Old value
    uint256 newValue      // New value
);
```

## Default Configuration Values

- Minimum stake amount: 1 ETH
- Maximum stake amount: 100 ETH
- Minimum stake lock time: 7 days
- Minimum transaction duration: 1 day
- Maximum transaction duration: 30 days
- Minimum transaction fee rate: 1% (100 basis points)
- Arbitration timeout: 24 hours
- Arbitration frozen period: 30 minutes
- System fee rate: 5% (500 basis points)
- System compensation fee rate: 2% (200 basis points)
- Arbitration BTC fee rate: 1% (100 basis points)

## Security Considerations

1. Access Control
- Only authorized addresses can modify configurations
- Critical parameters should have reasonable bounds
- Changes should be carefully validated

2. Parameter Validation
- All input values should be within acceptable ranges
- Time-based parameters should be reasonable
- Fee rates should be properly scaled

3. State Management
- Configuration changes should maintain system consistency
- Updates should be atomic where necessary
- Changes should be properly logged

## Best Practices

1. Configuration Updates
- Verify parameter ranges before updates
- Consider impact on existing transactions
- Update related parameters together
- Monitor and log all configuration changes

2. System Administration
- Regular review of configuration values
- Document reasons for configuration changes
- Monitor effects of parameter adjustments
- Maintain configuration change history