# 配置管理器 (ConfigManager)

## 概述
ConfigManager 负责管理 BeLayer2 仲裁协议的各项配置参数，包括质押要求、时间限制、费率设置等。所有配置更改都需要由合约所有者执行。

## 核心功能

### 质押相关配置

```solidity
function setMinStake(uint256 amount) external;
function setMaxStake(uint256 amount) external;
function setMinStakeLockedTime(uint256 time) external;
```
- `setMinStake`: 设置最低质押金额（默认：1 ETH）
- `setMaxStake`: 设置最高质押金额（默认：100 ETH）
- `setMinStakeLockedTime`: 设置最短质押锁定时间（默认：7天）

### 时间相关配置

```solidity
function setMinTransactionDuration(uint256 duration) external;
function setMaxTransactionDuration(uint256 duration) external;
function setArbitrationTimeout(uint256 timeout) external;
function getArbitrationTimeout() external view returns (uint256);
```
- `setMinTransactionDuration`: 设置最短交易持续时间（默认：1天）
- `setMaxTransactionDuration`: 设置最长交易持续时间（默认：30天）
- `setArbitrationTimeout`: 设置仲裁超时时间，即提交签名的截止时间（默认：24小时）
- `getArbitrationTimeout`: 获取当前的仲裁超时时间

### 费率相关配置

```solidity
function setTransactionMinFeeRate(uint256 rate) external;
function setSystemFeeRate(uint256 rate) external;
function getSystemFeeRate() external view returns (uint256);
function setSystemCompensationFeeRate(uint256 rate) external;
function getSystemCompensationFeeRate() external view returns (uint256);
```
- `setTransactionMinFeeRate`: 设置最低交易费率（默认：1%，以基点表示，100 = 1%）
- `setSystemFeeRate`: 设置系统费率（默认：5%，以基点表示，500 = 5%）
- `getSystemFeeRate`: 获取当前系统费率
- `setSystemCompensationFeeRate`: 设置系统补偿费率（默认：2%，以基点表示，200 = 2%）
- `getSystemCompensationFeeRate`: 获取当前系统补偿费率

### 仲裁相关配置

```solidity
function setArbitrationFrozenPeriod(uint256 period) external;
function getArbitrationFrozenPeriod() external view returns (uint256);
```
- `setArbitrationFrozenPeriod`: 设置仲裁冻结期，即交易结束后无法接受或退出的时间段（默认：30分钟）
- `getArbitrationFrozenPeriod`: 获取当前的仲裁冻结期

### 系统费用收集器配置

```solidity
function setSystemFeeCollector(address collector) external;
function getSystemFeeCollector() external view returns (address);
```
- `setSystemFeeCollector`: 设置系统费用收集器地址
- `getSystemFeeCollector`: 获取当前的系统费用收集器地址

### 通用配置管理

```solidity
function getConfig(bytes32 key) external view returns (uint256);
function getAllConfigs() external view returns (bytes32[] memory keys, uint256[] memory values);
function setConfigs(bytes32[] calldata keys, uint256[] calldata values) external;
```
- `getConfig`: 通过键获取特定配置值
- `getAllConfigs`: 获取所有配置的键值对
- `setConfigs`: 批量设置多个配置项

### 配置键常量

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
```

### 事件

```solidity
event ConfigUpdated(
    bytes32 indexed key,  // 配置键
    uint256 oldValue,     // 旧值
    uint256 newValue      // 新值
);
```

## 默认配置值

- 最低质押金额：1 ETH
- 最高质押金额：100 ETH
- 最短质押锁定时间：7天
- 最短交易持续时间：1天
- 最长交易持续时间：30天
- 最低交易费率：1%（100基点）
- 仲裁超时时间：24小时
- 仲裁冻结期：30分钟
- 系统费率：5%（500基点）
- 系统补偿费率：2%（200基点）
