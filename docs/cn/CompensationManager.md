# 补偿管理器 (CompensationManager)

## 概述
CompensationManager 负责处理协议中的各类补偿申请，包括非法签名补偿、超时补偿、仲裁失败补偿和仲裁人费用补偿等。它与仲裁人管理器、交易管理器和配置管理器等其他合约协同工作。

## 核心功能

### 补偿申请

```solidity
function claimIllegalSignatureCompensation(
    address arbitrator,
    bytes32 evidence
) external returns (bytes32 claimId);
```
申请非法签名补偿：
- `arbitrator`: 仲裁人地址
- `evidence`: zkProof证据哈希
- 返回: 补偿申请ID

```solidity
function claimTimeoutCompensation(
    bytes32 id
) external returns (bytes32 claimId);
```
申请超时补偿：
- `id`: 交易ID
- 返回: 补偿申请ID

```solidity
function claimFailedArbitrationCompensation(
    bytes32 evidence
) external returns (bytes32 claimId);
```
申请仲裁失败补偿：
- `evidence`: zkProof证据哈希
- 返回: 补偿申请ID

```solidity
function claimArbitratorFee(
    bytes32 txId
) external returns (bytes32 claimId);
```
申请仲裁人费用补偿：
- `txId`: 交易ID
- 要求：
  - 交易必须存在
  - 调用者必须是交易的仲裁人
  - 仲裁人必须已提交有效签名
  - 锁定期必须已过
  - 交易未完成
- 返回: 补偿申请ID

### 补偿提取

```solidity
function withdrawCompensation(bytes32 claimId) external payable;
```
提取补偿：
- `claimId`: 补偿申请ID
- 要求：
  - 补偿未被提取
  - 有可用的补偿金额
  - 接收补偿地址不为零地址

### 查询功能

```solidity
function getClaimableAmount(
    bytes32 claimId
) external view returns (uint256);
```
查询可申请的补偿金额：
- `claimId`: 补偿申请ID
- 返回: 可申请的补偿金额

### 管理员配置

```solidity
function initialize(
    address _zkService,
    address _configManager,
    address _arbitratorManager,
    address _signatureValidationService
) external;
```
初始化补偿管理器：
- `_zkService`: 交易及交易签名ZK服务地址，用于验证非法签名补偿
- `_configManager`: 配置管理器地址
- `_arbitratorManager`: 仲裁人管理器地址
- `_signatureValidationService`: 签名验证的zk服务地址，用于验证仲裁失败补偿

```solidity
function setZkService(address _zkService) external;
function setTransactionManager(address _transactionManager) external;
function setConfigManager(address _configManager) external;
function setArbitratorManager(address _arbitratorManager) external;
function setSignatureValidationService(address _signatureValidationService) external;
```
设置关键接口地址

### 事件

```solidity
// 补偿申请事件
event CompensationClaimed(
    bytes32 indexed claimId,
    address indexed claimer,
    address indexed arbitrator,
    uint256 ethAmount,
    uint256[] nftTokenIds,
    uint256 totalAmount,
    address receivedCompensationAddress,
    uint8 claimType
);

// 补偿提取事件
event CompensationWithdrawn(
    bytes32 indexed claimId,
    address indexed claimer,
    address indexed receivedCompensationAddress,
    uint256 ethAmount,
    uint256[] nftTokenIds,
    uint256 systemFee,
    uint256 excessPaymenttoClaimer
);

// 管理员配置事件
event ZkServiceUpdated(address indexed newZkService);
event TransactionManagerUpdated(address indexed newTransactionManager);
event ConfigManagerUpdated(address indexed newConfigManager);
event ArbitratorManagerUpdated(address indexed newArbitratorManager);
event SignatureValidationServiceUpdated(address indexed newSignatureValidationService);
```

### 数据结构

```solidity
struct CompensationClaim {
    address claimer;              // 申请人地址
    address arbitrator;           // 仲裁人地址
    uint256 ethAmount;           // ETH补偿金额
    address nftContract;         // NFT合约地址
    uint256[] nftTokenIds;       // NFT代币ID列表
    uint256 totalAmount;         // 总补偿金额
    bool withdrawn;              // 是否已提取
    CompensationType claimType;  // 补偿类型
    address receivedCompensationAddress;  // 接收补偿地址
}

enum CompensationType {
    IllegalSignature,   // 非法签名
    Timeout,           // 超时
    FailedArbitration, // 仲裁失败
    ArbitratorFee      // 仲裁人费用
}
