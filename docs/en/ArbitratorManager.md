# Arbitrator Manager (ArbitratorManager)

## Overview
ArbitratorManager is responsible for managing arbitrator registration, staking, and status changes. Arbitrators must stake ETH, ERC20 tokens, or NFTs to participate in arbitration work, and their status and activities are strictly managed within the protocol. The value of staked assets is evaluated and managed by the AssetManager contract.

## Core Functions

### Staking Operations

```solidity
function stakeETH() external payable;
function stakeERC20(address token, uint256 amount) external;
function stakeNFT(uint256[] calldata tokenIds) external;
function unstake() external;  // Withdraw all staked assets
```

### Arbitrator Registration

```solidity
function registerArbitratorByStakeETH(
    string calldata defaultBtcAddress,
    bytes calldata defaultBtcPubKey,
    uint256 feeRate,
    uint256 btcFeeRate,
    uint256 deadline
) external payable;
```
Register as an arbitrator using ETH stake:
- `defaultBtcAddress`: Bitcoin address for receiving revenue, set as both revenue and operation address
- `defaultBtcPubKey`: Corresponding Bitcoin public key, set as both revenue and operation public key
- `feeRate`: Service fee rate (multiplied by 10000)
- `btcFeeRate`: BTC service fee rate (multiplied by 10000)
- `deadline`: Service deadline timestamp (0 means no deadline)
- Must meet minimum ETH staking requirement
- Sender is set as operator and revenue receiver by default
- Successful registration triggers ArbitratorRegistered event

```solidity
function registerArbitratorByStakeERC20(
    address token,
    uint256 amount,
    string calldata defaultBtcAddress,
    bytes calldata defaultBtcPubKey,
    uint256 feeRate,
    uint256 btcFeeRate,
    uint256 deadline
) external;
```
Register as an arbitrator using ERC20 token stake:
- `token`: Address of the ERC20 token contract to stake
- `amount`: Amount of tokens to stake
- `defaultBtcAddress`: Bitcoin address for receiving revenue, set as both revenue and operation address
- `defaultBtcPubKey`: Corresponding Bitcoin public key, set as both revenue and operation public key
- `feeRate`: ETH service fee rate (multiplied by 10000)
- `btcFeeRate`: BTC service fee rate (multiplied by 10000)
- `deadline`: Service deadline timestamp (0 means no deadline)
- Must stake tokens with sufficient value
- Sender is set as operator and revenue receiver by default
- Successful registration triggers ArbitratorRegistered event

```solidity
function registerArbitratorByStakeNFT(
    uint256[] calldata tokenIds,
    string calldata defaultBtcAddress,
    bytes calldata defaultBtcPubKey,
    uint256 feeRate,
    uint256 btcFeeRate,
    uint256 deadline
) external;
```
Register as an arbitrator using NFT stake:
- `tokenIds`: Array of NFT tokens to stake
- `defaultBtcAddress`: Bitcoin address for receiving revenue, set as both revenue and operation address
- `defaultBtcPubKey`: Corresponding Bitcoin public key, set as both revenue and operation public key
- `feeRate`: Service fee rate (multiplied by 10000)
- `btcFeeRate`: BTC service fee rate (multiplied by 10000)
- `deadline`: Service deadline timestamp (0 means no deadline)
- Must stake sufficient number of NFTs
- Sender is set as operator and revenue receiver by default
- Successful registration triggers ArbitratorRegistered event

### Configuration Management

```solidity
function setOperator(
    address operator,
    bytes calldata btcPubKey,
    string calldata btcAddress
) external;
```
Set operator information:
- `operator`: Operator address
- `btcPubKey`: Operator's Bitcoin public key
- `btcAddress`: Operator's Bitcoin address

```solidity
function setRevenueAddresses(
    address ethAddress,
    bytes calldata btcPubKey,
    string calldata btcAddress
) external;
```
Set revenue receiver information:
- `ethAddress`: Revenue receiver's Ethereum address
- `btcPubKey`: Revenue receiver's Bitcoin public key
- `btcAddress`: Revenue receiver's Bitcoin address

```solidity
function setFeeRates(uint256 ethFeeRate, uint256 btcFeeRate) external;
```
Update ETH and BTC fee rates:
- `ethFeeRate`: New ETH service fee rate
- `btcFeeRate`: New BTC service fee rate
- Must meet minimum fee rate requirements

```solidity
function setArbitratorDeadline(uint256 deadline) external;
```
Update deadline:
- `deadline`: New deadline

### Status Management

```solidity
function pause() external;    // Pause accepting new transactions
function unpause() external;  // Resume accepting new transactions
function frozenArbitrator(address arbitrator) external;  // Freeze arbitrator
function isFrozenStatus(address arbitrator) external view returns (bool);  // Check if arbitrator is frozen
function isPaused(address arbitrator) external view returns (bool);  // Check if arbitrator is paused
```

### Work Status Management

```solidity
function setArbitratorWorking(address arbitrator, bytes32 transactionId) external;
```
Set arbitrator as processing specific transaction (only callable by transaction manager)

```solidity
function releaseArbitrator(address arbitrator, bytes32 transactionId) external;
```
Release arbitrator's work status (only callable by transaction manager)

```solidity
function terminateArbitratorWithSlash(address arbitrator) external;
```
Terminate arbitrator and confiscate stake (only callable by compensation manager)

### Admin Configuration

```solidity
function setTransactionManager(address _transactionManager) external;
function setCompensationManager(address _compensationManager) external;
function setAssetManager(address _assetManager) external;
```

### Query Functions

```solidity
function getArbitratorBasicInfo(address arbitrator) external view returns (DataTypes.ArbitratorBasicInfo memory);
function getArbitratorRevenueInfo(address arbitrator) external view returns (DataTypes.ArbitratorRevenueInfo memory);
function getArbitratorOperationInfo(address arbitrator) external view returns (DataTypes.ArbitratorOperationInfo memory);
function getArbitratorAssets(address arbitrator) external view returns (DataTypes.ArbitratorAssets memory);
function getAvailableStake(address arbitrator) external view returns (uint256);
function getFee(uint256 duration, address arbitrator) external view returns (uint256 fee);
function getBtcFee(uint256 duration, address arbitrator) external view returns (uint256 fee);
function isConfigModifiable(address arbitrator) external view returns (bool);
function isActiveArbitrator(address arbitrator) external view returns (bool);
function isOperatorOf(address arbitrator, address operator) external view returns (bool);
function isPaused(address arbitrator) external view returns (bool);
```

- `getArbitratorBasicInfo`: Get basic information about the arbitrator
- `getArbitratorRevenueInfo`: Get revenue information about the arbitrator
- `getArbitratorOperationInfo`: Get operation information about the arbitrator
- `getArbitratorAssets`: Get information about arbitrator's staked assets
- `getAvailableStake`: Get available stake amount
- `getFee`: Get ETH arbitration fee based on transaction duration
- `getBtcFee`: Get BTC arbitration fee based on transaction duration
- `isConfigModifiable`: Check if configuration can be modified
- `isActiveArbitrator`: Check if arbitrator is active
- `isOperatorOf`: Check if given address is arbitrator's operator
- `isPaused`: Check if arbitrator is paused

### Events

```solidity
// Initialization events
event InitializedManager(
    address indexed transactionManager, 
    address indexed compensationManager
);

// Staking events
event StakeAdded(
    address indexed arbitrator, 
    address indexed assetAddress,  // 0x0 for ETH
    uint256 amount,
    uint256[] nftTokenIds
);

event StakeWithdrawn(
    address indexed arbitrator,
    uint256 ethAmount,
    address indexed erc20Address,
    uint256 erc20Amount,
    address indexed nftAddress,
    uint256[] nftTokenIds
);

// Configuration update events
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

// Status change events
event ArbitratorPaused(address indexed arbitrator);
event ArbitratorUnpaused(address indexed arbitrator);
event ArbitratorFrozen(address indexed arbitrator);
event ArbitratorTerminatedWithSlash(address indexed arbitrator);
event ArbitratorWorking(address indexed arbitrator, bytes32 indexed transactionId);
event ArbitratorReleased(address indexed arbitrator, bytes32 indexed transactionId);

// Admin configuration events
event TransactionManagerUpdated(
    address indexed oldManager,
    address indexed newManager
);

event CompensationManagerUpdated(
    address indexed oldManager,
    address indexed newManager
);

event AssetManagerUpdated(
    address indexed assetManager
);

event ConfigManagerUpdated(
    address indexed newConfigManager
);

// Arbitrator registration events
event ArbitratorRegistered(
    address indexed arbitrator,
    address indexed operator,
    address revenueAddress,
    string btcAddress,
    bytes btcPubKey,
    uint256 feeRate,
    uint256 btcFeeRate,
    uint256 deadline
);