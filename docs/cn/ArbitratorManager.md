# 仲裁人管理器 (ArbitratorManager)

## 概述
ArbitratorManager 负责管理仲裁人的注册、质押、状态变更等操作。仲裁人需要质押 ETH 或 NFT 才能参与仲裁工作，其状态和活动在协议中被严格管理。

## 核心功能

### 质押操作

```solidity
function stakeETH() external payable;
function stakeNFT(uint256[] calldata tokenIds) external;
function unstake() external;  // 取回所有质押资产
```

### 仲裁人注册

```solidity
function registerArbitratorByStakeETH(
    string calldata defaultBtcAddress,
    bytes calldata defaultBtcPubKey,
    uint256 feeRate,
    uint256 deadline
) external payable;
```
使用 ETH 质押注册为仲裁人：
- `defaultBtcAddress`: 接收收益的比特币地址，同时设置为收益地址和操作地址
- `defaultBtcPubKey`: 对应的比特币公钥，同时设置为收益公钥和操作公钥
- `feeRate`: 服务费率（放大10000倍）
- `deadline`: 服务截止时间戳（0表示无截止时间）
- 注册时必须满足最低ETH质押要求
- 默认将发送者设置为操作者和收益接收者
- 注册成功后会触发 ArbitratorRegistered 事件

```solidity
function registerArbitratorByStakeNFT(
    uint256[] calldata tokenIds,
    string calldata defaultBtcAddress,
    bytes calldata defaultBtcPubKey,
    uint256 feeRate,
    uint256 deadline
) external;
```
使用 NFT 质押注册为仲裁人：
- `tokenIds`: 要质押的 NFT 代币数组
- `defaultBtcAddress`: 接收收益的比特币地址，同时设置为收益地址和操作地址
- `defaultBtcPubKey`: 对应的比特币公钥，同时设置为收益公钥和操作公钥
- `feeRate`: 服务费率（放大10000倍）
- `deadline`: 服务截止时间戳（0表示无截止时间）
- 必须质押足够数量的NFT
- 默认将发送者设置为操作者和收益接收者
- 注册成功后会触发 ArbitratorRegistered 事件

### 配置管理

```solidity
function setOperator(
    address operator,
    bytes calldata btcPubKey,
    string calldata btcAddress
) external;
```
设置操作者信息：
- `operator`: 操作者地址
- `btcPubKey`: 操作者的比特币公钥
- `btcAddress`: 操作者的比特币地址

```solidity
function setRevenueAddresses(
    address ethAddress,
    bytes calldata btcPubKey,
    string calldata btcAddress
) external;
```
设置收益接收者信息：
- `ethAddress`: 收益接收者以太坊地址
- `btcPubKey`: 收益接收者的比特币公钥
- `btcAddress`: 收益接收者的比特币地址

```solidity
function setArbitratorFeeRate(uint256 feeRate) external;
function setArbitratorDeadline(uint256 deadline) external;
```
更新费率和截止时间：
- `feeRate`: 新的服务费率
- `deadline`: 新的截止时间

### 状态管理

```solidity
function pause() external;    // 暂停接受新交易
function unpause() external;  // 恢复接受新交易
function frozenArbitrator(address arbitrator) external;  // 冻结仲裁人
function isFrozenStatus(address arbitrator) external view returns (bool);  // 检查仲裁人是否被冻结
function isPaused(address arbitrator) external view returns (bool);  // 检查仲裁人是否暂停
```

### 工作状态管理

```solidity
function setArbitratorWorking(address arbitrator, bytes32 transactionId) external;
```
设置仲裁人正在处理特定交易（仅限交易管理器调用）

```solidity
function releaseArbitrator(address arbitrator, bytes32 transactionId) external;
```
释放仲裁人的工作状态（仅限交易管理器调用）

```solidity
function terminateArbitratorWithSlash(address arbitrator) external;
```
终止仲裁人并没收其质押（仅限补偿管理器调用）

### 管理员配置

```solidity
function setTransactionManager(address _transactionManager) external;
function setCompensationManager(address _compensationManager) external;
function initTransactionAndCompensationManager(
    address _transactionManager, 
    address _compensationManager
) external;
function setNFTContract(address _nftContract) external;
```

### 查询功能

```solidity
function getArbitratorInfo(address arbitrator) external view returns (DataTypes.ArbitratorInfo memory);
function getAvailableStake(address arbitrator) external view returns (uint256);
function getTotalNFTStakeValue(address arbitrator) external view returns (uint256);
function isConfigModifiable(address arbitrator) external view returns (bool);
function isActiveArbitrator(address arbitrator) external view returns (bool);
function isOperatorOf(address arbitrator, address operator) external view returns (bool);
```

- `getArbitratorInfo`: 获取仲裁人的详细信息
- `getAvailableStake`: 获取可用的质押金额
- `getTotalNFTStakeValue`: 获取NFT质押总价值
- `isConfigModifiable`: 检查是否可以修改配置
- `isActiveArbitrator`: 检查仲裁人是否处于活跃状态
- `isOperatorOf`: 检查给定地址是否为仲裁人的操作者

### 事件

```solidity
// 初始化事件
event InitializedManager(
    address indexed transactionManager, 
    address indexed compensationManager
);

// 质押相关事件
event StakeAdded(
    address indexed arbitrator, 
    address indexed assetAddress,  // 0x0 for ETH
    uint256 amount,
    uint256[] nftTokenIds
);

event StakeWithdrawn(
    address indexed arbitrator,
    address indexed assetAddress,  // 0x0 for ETH
    uint256 amount
);

// 配置更新事件
event OperatorSet(
    address indexed arbitrator,
    address indexed operator,
    bytes btcPubKey,
    string btcAddress
);

event RevenueAddressesSet(
    address indexed arbitrator,
    address ethAddress,
    bytes btcPubKey,
    string btcAddress
);

event ArbitratorFeeRateUpdated(
    address indexed arbitrator,
    uint256 feeRate
);

event ArbitratorDeadlineUpdated(
    address indexed arbitrator, 
    uint256 deadline
);

// 状态变更事件
event ArbitratorPaused(address indexed arbitrator);
event ArbitratorUnpaused(address indexed arbitrator);
event ArbitratorFrozen(address indexed arbitrator);
event ArbitratorTerminatedWithSlash(address indexed arbitrator);
event ArbitratorWorking(address indexed arbitrator, bytes32 indexed transactionId);
event ArbitratorReleased(address indexed arbitrator, bytes32 indexed transactionId);

// 管理员配置事件
event TransactionManagerUpdated(address indexed oldManager, address indexed newManager);
event CompensationManagerUpdated(address indexed oldManager, address indexed newManager);
event NFTContractUpdated(address indexed oldNFTContract, address indexed newNFTContract);

// 仲裁人注册事件
event ArbitratorRegistered(
    address indexed arbitrator,
    address indexed operator,
    address revenueAddress,
    string btcAddress,
    bytes btcPubKey,
    uint256 feeRate,
    uint256 deadline
);
