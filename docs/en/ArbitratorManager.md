# Arbitrator Manager (ArbitratorManager)

## Overview
ArbitratorManager is responsible for managing arbitrator registration, staking, and status changes. Arbitrators must stake ETH or NFTs to participate in arbitration work, and their status and activities are strictly managed within the protocol.

## Core Functions

### Staking Operations

```solidity
function stakeETH() external payable;
function stakeNFT(uint256[] calldata tokenIds) external;
function unstake() external;  // Withdraw all staked assets
```

### Arbitrator Registration

```solidity
function registerArbitratorByStakeETH(
    string calldata defaultBtcAddress,
    bytes calldata defaultBtcPubKey,
    uint256 feeRate,
    uint256 deadline
) external payable;
```
Register as an arbitrator using ETH stake:
- `defaultBtcAddress`: Bitcoin address for receiving revenue, set as both revenue and operation address
- `defaultBtcPubKey`: Corresponding Bitcoin public key, set as both revenue and operation public key
- `feeRate`: Service fee rate (multiplied by 10000)
- `deadline`: Service deadline timestamp (0 means no deadline)
- Must meet minimum ETH staking requirement
- Sender is set as operator and revenue receiver by default
- Successful registration triggers ArbitratorStatusChanged event

```solidity
function registerArbitratorByStakeNFT(
    uint256[] calldata tokenIds,
    string calldata defaultBtcAddress,
    bytes calldata defaultBtcPubKey,
    uint256 feeRate,
    uint256 deadline
) external;
```
Register as an arbitrator using NFT stake:
- `tokenIds`: Array of NFT tokens to stake
- `defaultBtcAddress`: Bitcoin address for receiving revenue, set as both revenue and operation address
- `defaultBtcPubKey`: Corresponding Bitcoin public key, set as both revenue and operation public key
- `feeRate`: Service fee rate (multiplied by 10000)
- `deadline`: Service deadline timestamp (0 means no deadline)
- Must stake sufficient number of NFTs
- Sender is set as operator and revenue receiver by default
- Successful registration triggers ArbitratorStatusChanged event

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
function setRevenue(
    address revenue,
    bytes calldata btcPubKey,
    string calldata btcAddress
) external;
```
Set revenue receiver information:
- `revenue`: Revenue receiver address
- `btcPubKey`: Revenue receiver's Bitcoin public key
- `btcAddress`: Revenue receiver's Bitcoin address

```solidity
function setFeeRate(uint256 feeRate) external;
function setDeadline(uint256 deadline) external;
```
Update fee rate and deadline:
- `feeRate`: New service fee rate
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
function initTransactionAndCompensationManager(
    address _transactionManager, 
    address _compensationManager
) external;
function setNFTContract(address _nftContract) external;
```

### Query Functions

```solidity
function getArbitratorInfo(address arbitrator) external view returns (DataTypes.ArbitratorInfo memory);
function getAvailableStake(address arbitrator) external view returns (uint256);
function getTotalNFTStakeValue(address arbitrator) external view returns (uint256);
function isConfigModifiable(address arbitrator) external view returns (bool);
function isActiveArbitrator(address arbitrator) external view returns (bool);
function isOperatorOf(address arbitrator, address operator) external view returns (bool);
```

- `getArbitratorInfo`: Get detailed arbitrator information
- `getAvailableStake`: Get available stake amount
- `getTotalNFTStakeValue`: Get total value of NFT stake
- `isConfigModifiable`: Check if configuration can be modified
- `isActiveArbitrator`: Check if arbitrator is active
- `isOperatorOf`: Check if given address is arbitrator's operator

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
    address indexed assetAddress,  // 0x0 for ETH
    uint256 amount
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
event TransactionManagerUpdated(address indexed oldManager, address indexed newManager);
event CompensationManagerUpdated(address indexed oldManager, address indexed newManager);
event NFTContractUpdated(address indexed oldNFTContract, address indexed newNFTContract);

// Arbitrator registration events
event ArbitratorRegistered(
    address indexed arbitrator,
    address indexed operator,
    address revenueAddress,
    string btcAddress,
    bytes btcPubKey,
    uint256 feeRate,
    uint256 deadline
);