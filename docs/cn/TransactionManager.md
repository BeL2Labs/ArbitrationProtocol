# 交易管理器 (TransactionManager)

## 概述
TransactionManager 是仲裁协议中负责管理跨链交易生命周期的核心组件。它负责交易的注册、UTXO上传、仲裁请求处理、签名提交等关键功能，并与补偿系统紧密集成以处理异常情况。

## 核心功能

### 1. 交易注册与管理

```solidity
function registerTransaction(
    address arbitrator,
    uint256 deadline,
    address compensationReceiver,
    address refundAddress
) external payable returns (bytes32 id);
```
注册新的交易。
- `arbitrator`: 选定的仲裁人地址
- `deadline`: 交易截止时间戳
- `compensationReceiver`: 补偿接收地址
- `refundAddress`: 退款地址
- `msg.value`: 必须等于所需的注册费用
- 返回值: 唯一交易ID

```solidity
function uploadUTXOs(
    bytes32 id,
    DataTypes.UTXO[] calldata utxos
) external;
```
上传交易的UTXO数据，每个交易只能上传一次。
- `id`: 交易ID
- `utxos`: UTXO数据数组

```solidity
function completeTransaction(bytes32 id) external;
```
标记交易为已完成。

```solidity
function completeTransactionWithSlash(bytes32 id, address receivedCompensationAddress) external;
```
标记交易为已完成并处罚仲裁人, 并将补偿发送给指定地址。仅限CompensationManager调用

```solidity
function isAbleCompletedTransaction(bytes32 id) external view returns (bool);
```
检查交易是否可以完成。

### 2. 仲裁功能

```solidity
function requestArbitration(
    bytes32 id,
    bytes calldata signData,
    DataTypes.SignDataType signDataType,
    bytes calldata script,
    address timeoutCompensationReceiver
) external;
```
请求交易仲裁。必须先上传UTXO数据。
- `id`: 交易ID
- `signData`: 待签名数据
- `signDataType`: 签名数据类型，目前仅支持Witness
- `script`: 交易脚本数据
- `timeoutCompensationReceiver`: 超时补偿接收地址

```solidity
function submitArbitration(
    bytes32 id,
    bytes calldata btcTxSignature
) external;
```
提交仲裁结果和签名, 仅限仲裁人调用。
- `id`: 交易ID
- `btcTxSignature`: 对signData的签名

### 3. 查询功能

```solidity
function getTransactionById(bytes32 id) external view returns (DataTypes.Transaction memory);
function getTransaction(bytes32 txHash) external view returns (DataTypes.Transaction memory);
function txHashToId(bytes32 txHash) external view returns (bytes32);
```
交易信息查询功能：
- 通过ID或哈希获取交易信息
- 将交易哈希转换为ID

```solidity
function getRegisterTransactionFee(uint256 deadline, address arbitrator) external view returns (uint256 fee);
```
计算注册交易所需的费用。

### 4. 费用管理

```solidity
function transferArbitrationFee(
    bytes32 id
) external returns (uint256 arbitratorFee, uint256 systemFee);
```
转移仲裁费用给仲裁人和系统。
- 仅可由CompensationManager调用
- 返回仲裁人费用和系统费用金额

### 5. 初始化和配置

```solidity
function initialize(address _arbitratorManager, address _dappRegistry, address _configManager, address _compensationManager) external;
function setArbitratorManager(address _arbitratorManager) external;
```
系统初始化和配置功能。

## 事件系统

```solidity
event TransactionRegistered(
    bytes32 indexed id,
    address indexed dapp,
    address indexed arbitrator,
    uint256 deadline,
    uint256 depositFee,
    address compensationReceiver
);

event UTXOsUploaded(
    bytes32 indexed txId,
    address indexed dapp
);

event TransactionCompleted(
    bytes32 indexed txId,
    address indexed dapp
);

event ArbitrationRequested(
    bytes32 indexed txId,
    address indexed dapp,
    address arbitrator,
    bytes signData,
    bytes script,
    address timeoutCompensationReceiver
);

event ArbitrationSubmitted(
    bytes32 indexed txId,
    address indexed dapp,
    address indexed arbitrator,
    bytes btcTxSignature
);

event SetArbitratorManager(
    address indexed arbitratorManager
);
```

## 工作流程

### 1. 正常流程
1. DApp注册交易
   - 选择仲裁人并设置截止时间
   - 支付必要的费用
   - 设置补偿接收地址
   - 获得交易ID

2. 上传UTXO数据
   - 提供交易相关的UTXO信息
   - 只能上传一次

3. 请求仲裁
   - 提供待签名数据和脚本
   - 指定签名数据类型
   - 设置超时补偿接收地址

4. 仲裁人签名
   - 验证交易内容
   - 生成签名
   - 提交签名

5. 完成交易
   - 正常完成或带惩罚完成
   - 更新状态
   - 处理费用分配

### 2. 异常处理流程
1. 仲裁人超时
   - 通过补偿管理器申请超时补偿
   - 补偿发送到指定的补偿接收地址

2. 非法签名
   - 通过补偿管理器申请非法签名补偿
   - 提供证据
   - 补偿发送到请求仲裁时指定的超时补偿接收地址

3. 错误签名
   - 通过补偿管理器申请错误签名补偿
   - 提供证据
   - 补偿发送到注册时指定的补偿接收地址

## 使用示例

### 示例 1: DApp 注册交易
```javascript
// 1. 计算所需费用
const deadline = Math.floor(Date.now() / 1000) + 24 * 3600; // 24小时后
const fee = await transactionManager.getRegisterTransactionFee(
    deadline,
    arbitratorAddress
);

// 2. 注册交易
const tx = await transactionManager.registerTransaction(
    arbitratorAddress,
    deadline,
    compensationReceiver,
    refundAddress,
    { value: fee }
);
const receipt = await tx.wait();

// 3. 获取交易ID
const txId = receipt.events.find(e => e.event === 'TransactionRegistered').args.id;

// 4. 上传UTXO数据
await transactionManager.uploadUTXOs(txId, utxos);
```

### 示例 2: 请求仲裁签名
```javascript
// 1. 准备签名数据
    const transactionId = "0x..."; // Transaction ID
    const btcTx = "0x..."; // Transaction data
    const signData = "0x..."; // Data to be signed
    const script = "0x..."; // Script data
    const timeoutCompensationReceiver = "0x..."; // Timeout compensation receiver (ETH address)
    
    const arbitrationData = {
        id: transactionId,
        rawData: btcTx,
        signDataType: 0, // 对应SignDataType.Witness
        signHashFlag: 0, // Default hash flag
        script: "", // Default unlock script
        timeoutCompensationReceiver: timeoutCompensationReceiver
    };

// 2. 请求仲裁
function requestArbitration(
    DataTypes.ArbitrationData calldata arbitrationData) external nonReentrant;
```

### 示例 3: 仲裁人提交签名
```javascript
// 1. 生成签名
const signature = "0x..."; // 比特币交易签名

// 2. 提交签名
await transactionManager.submitArbitration(
    txId,
    signature
);
```

## 错误处理
合约会在以下情况抛出错误：
- 交易已存在
- 交易不存在
- UTXO已上传
- 仲裁人未授权
- 费用不足
- 交易已过期
- 状态错误
- 权限不足

## 安全考虑
1. 交易ID使用密码学安全的哈希
2. UTXO数据只能上传一次
3. 多层补偿机制保护用户权益
4. 截止时间机制防止交易无限期挂起
5. 费用机制防止垃圾交易
6. 状态检查防止重复操作

## 与其他组件的交互
1. ArbitratorManager：验证仲裁人状态和权限
2. DAppRegistry：验证DApp注册状态
3. ConfigManager：获取系统配置参数
4. CompensationManager：处理补偿和惩罚

## 最佳实践
1. 注册交易前计算准确的费用
2. 及时上传UTXO数据
3. 设置合理的截止时间
4. 正确配置补偿接收地址
5. 在请求仲裁前验证签名数据的正确性
6. 及时处理超时和错误情况
7. 保持交易状态的及时更新
