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
- `evidence`: 证据哈希
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
- `evidence`: 证据哈希
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
function getWithdrawCompensationFee(bytes32 claimId) external view returns (uint256);
```
提取补偿：
- `withdrawCompensation`: 提取补偿
  - `claimId`: 补偿申请ID
  - 要求：
    - 补偿未被提取
    - 有可用的补偿金额
    - 接收补偿地址不为零地址
- `getWithdrawCompensationFee`: 获取提取补偿所需的手续费
  - `claimId`: 补偿申请ID
  - 返回: 提取补偿所需的手续费金额

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
    address erc20Token,
    uint256 erc20Amount,
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
    address erc20Token,
    uint256 erc20Amount,
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
    address erc20Token;          // ERC20代币合约地址
    uint256 erc20Amount;         // ERC20代币补偿金额
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

## 功能特点
- 非法签名补偿管理
- 超时补偿管理
- 仲裁失败补偿管理
- 仲裁人费用补偿管理
- 补偿计算和分配
- 补偿申请状态追踪

## 工作流程

### 1. 非法签名补偿流程
1. 检测到仲裁人提交了非法签名
2. 准备证据（对此相关的btc交易的zk证明）
3. 提交补偿申请，包含仲裁人地址和证据
4. 等待申请审核
5. 审核通过后提取补偿

### 2. 超时补偿流程
1. 交易超过截止时间
2. 使用交易ID提交超时补偿申请
3. 系统自动验证超时状态
4. 验证通过后提取补偿

### 3. 仲裁失败补偿流程
1. 检测到仲裁结果出现错误
2. 准备错误证据（仲裁交易签名验证不过的zk证明）
3. 提交仲裁失败补偿申请
4. 等待申请审核
5. 审核通过后提取补偿

### 4. 仲裁人费用补偿流程
1. 仲裁人提交有效签名
2. 锁定期已过
3. 交易未完成
4. 提交仲裁人费用补偿申请
5. 验证通过后提取补偿

## 安全考虑
1. 使用加密安全的哈希算法处理交易ID和证据
2. 严格的权限控制，确保只有授权用户可以申请补偿
3. 多层次的补偿机制保护用户权益
4. 使用超时机制防止交易无限期挂起
5. 使用费用机制防止垃圾申请
6. 状态检查防止重复操作

## 示例代码

### 示例1：申请非法签名补偿
```javascript
// 1. 准备证据对此相关的btc交易的zk证明）
const evidence; // TODO: generate from zkService

// 2. 提交补偿申请
const claimId = await compensationManager.claimIllegalSignatureCompensation(
    arbitrator,
    evidence
);

// 3. 查询并提取补偿
const amount = await compensationManager.getClaimableAmount(claimId);
if (amount > 0) {
    await compensationManager.withdrawCompensation(claimId);
}
```

### 示例2：申请超时补偿
```javascript
// 1. 提交超时补偿申请
const claimId = await compensationManager.claimTimeoutCompensation(txId);

// 2. 查询补偿金额
const amount = await compensationManager.getClaimableAmount(claimId);

// 3. 提取补偿
if (amount > 0) {
    await compensationManager.withdrawCompensation(claimId);
}
```

### 示例3：申请仲裁失败补偿
```javascript
// 1. 准备证据（仲裁交易签名验证不过的zk证明）
const evidence; // TODO: generate from signature Validation Service

// 2. 提交补偿申请
const claimId = await compensationManager.claimFailedArbitrationCompensation(
    evidence
);

// 3. 查询并提取补偿
const amount = await compensationManager.getClaimableAmount(claimId);
if (amount > 0) {
    await compensationManager.withdrawCompensation(claimId);
}
```

### 示例4：申请仲裁人费用补偿
```javascript
// 1. 提交仲裁人费用补偿申请
const claimId = await compensationManager.claimArbitratorFee(txId);

// 2. 查询补偿金额
const amount = await compensationManager.getClaimableAmount(claimId);

// 3. 提取补偿
if (amount > 0) {
    await compensationManager.withdrawCompensation(claimId);
}
```
