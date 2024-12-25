# Decentralized Arbitration Protocol

## 项目简介

Decentralized Arbitration Protocol 是一个创新的跨链区块链仲裁系统，旨在为区块链生态系统提供去中心化的争议解决方案。该协议支持以太坊和比特币网络，通过智能合约实现自动化的仲裁流程，为 DApp 和用户提供公平、透明的争议处理机制。

## 主要特性

- 跨链支持：同时支持以太坊和比特币网络的交易仲裁
- 去中心化仲裁：由多个独立仲裁人组成的仲裁团进行裁决
- 灵活的补偿机制：支持多种资产类型的赔付方案
- 可配置参数：支持动态调整系统参数，适应不同场景需求
- 安全可靠：基于智能合约实现，确保仲裁过程的透明性和不可篡改性

## 系统架构

### 核心模块

1. **DApp 注册管理 (DAppRegistry)**
   - DApp 注册和注销
   - 授权状态管理
   - 注册状态查询

2. **配置管理 (ConfigManager)**
   - 仲裁冻结期设置
   - 仲裁超时时间管理
   - 系统参数配置

3. **仲裁人管理 (ArbitratorManager)**
   - 仲裁人注册和管理
   - 操作员设置
   - 收益地址管理

4. **交易管理 (TransactionManager)**
   - 跨链交易处理
   - 交易状态追踪
   - 交易验证

5. **补偿管理 (CompensationManager)**
   - 补偿方案制定
   - 赔付执行
   - 多资产类型支持

## 工作流程

1. **DApp 接入流程**
   - DApp 注册到仲裁协议
   - 配置必要参数（最小质押、仲裁人数等）
   - 获取授权状态

2. **仲裁流程**
   - 发起仲裁请求
   - 仲裁人分配和确认
   - 证据提交和审查
   - 仲裁决策
   - 执行补偿

3. **补偿执行**
   - 确定补偿方案
   - 验证补偿条件
   - 执行资产转移
   - 完成补偿流程

## 安全考虑

- 所有关键操作都需要合约所有者权限
- 仲裁过程设有冻结期和超时机制
- 多重验证确保跨链交易安全
- 完善的事件日志记录

## 项目结构

```
contracts/
├── core/                   # 核心合约实现
│   ├── ArbitrationProtocol.sol
│   ├── DAppRegistry.sol
│   ├── ConfigManager.sol
│   ├── ArbitratorManager.sol
│   ├── TransactionManager.sol
│   └── CompensationManager.sol
├── interfaces/            # 接口定义
│   ├── IDAppRegistry.sol
│   ├── IConfigManager.sol
│   ├── IArbitratorManager.sol
│   ├── ITransactionManager.sol
│   └── ICompensationManager.sol
├── libraries/            # 工具库
│   ├── DataTypes.sol     # 数据类型定义
│   └── Errors.sol        # 错误信息定义
└── docs/                 # 文档
    ├── DAppRegistry.md
    ├── ConfigManager.md
    └── CompensationManager.md
```

## 部署注意事项

1. **合约部署顺序**
   - 首先部署配置管理合约
   - 然后部署 DApp 注册合约
   - 最后部署其他功能合约

2. **初始化配置**
   - 设置适当的仲裁冻结期
   - 配置合理的仲裁超时时间
   - 设置初始仲裁人要求

3. **权限管理**
   - 确保合约所有者地址安全
   - 谨慎管理操作员权限
   - 定期检查授权状态

## 开发环境

- Solidity 版本: ^0.8.20
- 开发框架: Hardhat/Truffle
- 依赖管理: npm/yarn

## 依赖项

- OpenZeppelin Contracts
  - @openzeppelin/contracts/access/Ownable.sol

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系我们：
- Issue 提交
- Pull Request
- 邮件联系

## Setting ArbitratorManager

To set the ArbitratorManager for the TransactionManager contract:

1. Replace `YOUR_TRANSACTION_MANAGER_ADDRESS` with the actual deployed TransactionManager contract address
2. Replace `YOUR_ARBITRATOR_MANAGER_ADDRESS` with the address of the ArbitratorManager you want to set
3. Run the script:

```bash
npx hardhat run scripts/setArbitratorManager.js --network <your-network>
```

Note: Ensure you are using an account with owner permissions when running this script.
