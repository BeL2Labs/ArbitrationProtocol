# DApp Registry (DAppRegistry)

## Overview
DAppRegistry is the DApp registration and management component in the arbitration protocol. It is responsible for managing all decentralized applications (DApps) that connect to the arbitration protocol, maintaining their status and configuration information. The contract design adopts an upgradeable pattern to support future functionality extensions and optimizations.

## Features
- DApp registration management
- DApp status query
- DApp authorization control
- Registration fee management
- Upgradeable design

## Core Functions

### 1. DApp Registration
Register a new DApp to the arbitration protocol:
```solidity
function registerDApp(address dappContract) external payable;
```

Parameters:
- `dappContract`: DApp contract address
- `msg.value`: Registration fee, must equal `REGISTRATION_FEE` (10 ETH)

The registration fee will be sent to the system fee collector. After registration, the DApp must be authorized using the `authorizeDApp` function before it can use the arbitration service.

### 2. DApp Deregistration
Deregister a DApp from the arbitration protocol:
```solidity
function deregisterDApp(address dapp) external;
```

Parameters:
- `dapp`: Address of the DApp to deregister

Deregistration sets the DApp status to Terminated. The registration fee is not refunded.

### 3. DApp Authorization
Authorize a DApp to use the arbitration service:
```solidity
function authorizeDApp(address dapp) external;
```

Parameters:
- `dapp`: Address of the DApp to authorize

After authorization, the DApp status will change to Active and it can start using the arbitration service.

### 4. DApp Status Query
Query the status of a DApp:
```solidity
function getDAppStatus(address dapp) external view returns (DataTypes.DAppStatus);
function isRegistered(address dapp) external view returns (bool);
function isActiveDApp(address dapp) external view returns (bool);
```

- `getDAppStatus`: Get the detailed status of a DApp
- `isRegistered`: Check if a DApp is registered
- `isActiveDApp`: Check if a DApp is authorized and active

### 5. DApp Owner Query
Query the owner of a DApp:
```solidity
function getDAppOwner(address dapp) external view returns (address);
```

### 6. Registration Fee Query
Query the required fee for DApp registration:
```solidity
function REGISTRATION_FEE() external view returns (uint256);
```

Returns the registration fee amount (10 ETH). This fee must be paid during registration and will be sent to the system fee collector.

## Event System
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

## Error Handling
The contract will throw errors in the following situations:
- DApp already registered
- DApp not registered
- DApp not authorized
- Insufficient registration fee
- Insufficient permissions
- Invalid parameters

## Security Considerations
1. Registration fee validation
2. Access control
3. State consistency maintenance
4. Upgradeable contract security
5. Event monitoring

## Interaction with Other Components
1. ConfigManager: System configuration management
2. ArbitratorManager: Arbitrator management
3. TransactionManager: Transaction management
4. CompensationManager: Compensation management

## Best Practices
1. Ensure sufficient fee before registration
2. Authorize promptly after registration
3. Check DApp status regularly
4. Follow access control requirements
5. Monitor relevant events

## Usage Examples

### Example 1: Register New DApp
```javascript
// 1. Get registration fee
const registrationFee = await dappRegistry.REGISTRATION_FEE();

// 2. Register DApp
const tx = await dappRegistry.registerDApp(dappAddress, {
    value: registrationFee
});
await tx.wait();

// 3. Verify registration status
const isRegistered = await dappRegistry.isRegistered(dappAddress);
console.log("DApp is registered:", isRegistered);
```

### Example 2: Authorize DApp
```javascript
// 1. Check registration status
const isRegistered = await dappRegistry.isRegistered(dappAddress);

// 2. Authorize DApp
if (isRegistered) {
    const tx = await dappRegistry.authorizeDApp(dappAddress);
    await tx.wait();
    
    // 3. Verify authorization status
    const isActive = await dappRegistry.isActiveDApp(dappAddress);
    console.log("DApp is active:", isActive);
}
```

### Example 3: Deregister DApp
```javascript
// 1. Check owner
const owner = await dappRegistry.getDAppOwner(dappAddress);
if (owner === userAddress) {
    // 2. Deregister DApp
    const tx = await dappRegistry.deregisterDApp(dappAddress);
    await tx.wait();
    
    // 3. Verify status
    const isRegistered = await dappRegistry.isRegistered(dappAddress);
    console.log("DApp is no longer registered:", !isRegistered);
}