# DApp 注册表 (DAppRegistry)

## 概述
DAppRegistry 是仲裁协议中的 DApp 注册和管理组件。它负责管理所有接入仲裁协议的去中心化应用程序（DApp），维护其状态和配置信息。合约设计采用可升级模式，支持未来功能的扩展和优化。

## 功能特性
- DApp 注册管理
- DApp 状态查询
- DApp 授权控制
- 注册费用管理
- 可升级设计

## 核心功能

### 1. DApp 注册
注册新的 DApp 到仲裁协议：
```solidity
function registerDApp(address dapp) external payable;
```

参数说明：
- dapp: DApp 合约地址
- msg.value: 注册费用，必须等于 REGISTRATION_FEE

### 2. DApp 注销
从仲裁协议中注销 DApp：
```solidity
function deregisterDApp(address dapp) external;
```

参数说明：
- dapp: 要注销的 DApp 地址

### 3. DApp 授权
授权 DApp 使用仲裁服务：
```solidity
function authorizeDApp(address dapp) external;
```

参数说明：
- dapp: 要授权的 DApp 地址

### 4. DApp 状态查询
查询 DApp 的状态：
```solidity
function getDAppStatus(address dapp) external view returns (DataTypes.DAppStatus);
function isRegistered(address dapp) external view returns (bool);
function isActiveDApp(address dapp) external view returns (bool);
```

### 5. DApp 所有者查询
查询 DApp 的所有者：
```solidity
function getDAppOwner(address dapp) external view returns (address);
```

### 6. 注册费用查询
查询 DApp 注册所需费用：
```solidity
function REGISTRATION_FEE() external view returns (uint256);
```

## 事件系统
```solidity
event DAppRegistered(
    address indexed dapp,
    address indexed owner
);

event DAppDeregistered(
    address indexed dapp
);

event DAppAuthorized(
    address indexed dapp
);

event DAppSuspended(
    address indexed dapp
);

event ConfigManagerUpdated(
    address indexed oldConfigManager,
    address indexed newConfigManager
);
```

## 错误处理
合约会在以下情况抛出错误：
- DApp 已注册
- DApp 未注册
- DApp 未授权
- 注册费用不足
- 权限不足
- 无效的参数

## 安全考虑
1. 注册费用验证
2. 权限控制
3. 状态一致性维护
4. 可升级合约安全
5. 事件监控

## 与其他组件的交互
1. ConfigManager: 系统配置管理
2. ArbitratorManager: 仲裁人管理
3. TransactionManager: 交易管理
4. CompensationManager: 补偿管理

## 最佳实践
1. 注册前确保有足够的费用
2. 注册后及时进行授权
3. 定期检查 DApp 状态
4. 遵循权限控制要求
5. 监听相关事件

## 使用示例

### 示例 1: 注册新 DApp
```javascript
// 1. 获取注册费用
const registrationFee = await dappRegistry.REGISTRATION_FEE();

// 2. 注册 DApp
const tx = await dappRegistry.registerDApp(dappAddress, {
    value: registrationFee
});
await tx.wait();

// 3. 验证注册状态
const isRegistered = await dappRegistry.isRegistered(dappAddress);
console.log("DApp is registered:", isRegistered);
```

### 示例 2: 授权 DApp
```javascript
// 1. 检查注册状态
const isRegistered = await dappRegistry.isRegistered(dappAddress);

// 2. 授权 DApp
if (isRegistered) {
    const tx = await dappRegistry.authorizeDApp(dappAddress);
    await tx.wait();
    
    // 3. 验证授权状态
    const isActive = await dappRegistry.isActiveDApp(dappAddress);
    console.log("DApp is active:", isActive);
}
```

### 示例 3: 注销 DApp
```javascript
// 1. 检查所有者
const owner = await dappRegistry.getDAppOwner(dappAddress);
if (owner === userAddress) {
    // 2. 注销 DApp
    const tx = await dappRegistry.deregisterDApp(dappAddress);
    await tx.wait();
    
    // 3. 验证状态
    const isRegistered = await dappRegistry.isRegistered(dappAddress);
    console.log("DApp is no longer registered:", !isRegistered);
}
