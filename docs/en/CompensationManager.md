# Compensation Manager (CompensationManager)

## Overview
CompensationManager is responsible for handling various compensation claims in the protocol, including illegal signature compensation, timeout compensation, failed arbitration compensation, and arbitrator fee compensation. It works in coordination with other contracts such as ArbitratorManager, TransactionManager, and ConfigManager.

## Core Functions

### Compensation Claims

```solidity
function claimIllegalSignatureCompensation(
    address arbitrator,
    bytes32 evidence
) external returns (bytes32 claimId);
```
Claim compensation for illegal signature:
- `arbitrator`: Arbitrator address
- `evidence`: Evidence hash
- Returns: Compensation claim ID

```solidity
function claimTimeoutCompensation(
    bytes32 id
) external returns (bytes32 claimId);
```
Claim timeout compensation:
- `id`: Transaction ID
- Returns: Compensation claim ID

```solidity
function claimFailedArbitrationCompensation(
    bytes32 evidence
) external returns (bytes32 claimId);
```
Claim compensation for failed arbitration:
- `evidence`: Evidence hash
- Returns: Compensation claim ID

```solidity
function claimArbitratorFee(
    bytes32 txId
) external returns (bytes32 claimId);
```
Claim arbitrator fee compensation:
- `txId`: Transaction ID
- Requirements:
  - Transaction must exist
  - Caller must be the transaction's arbitrator
  - Arbitrator must have submitted valid signature
  - Lock period must have passed
  - Transaction not completed
- Returns: Compensation claim ID

### Compensation Withdrawal

```solidity
function withdrawCompensation(bytes32 claimId) external payable;
function getWithdrawCompensationFee(bytes32 claimId) external view returns (uint256);
```
Compensation withdrawal functions:
- `withdrawCompensation`: Withdraw compensation
  - `claimId`: Compensation claim ID
  - Requirements:
    - Compensation not withdrawn
    - Available compensation amount
    - Compensation receiver address not zero
- `getWithdrawCompensationFee`: Get the fee required to withdraw compensation
  - `claimId`: Compensation claim ID
  - Returns: Fee amount required to withdraw compensation

### Query Functions

```solidity
function getClaimableAmount(
    bytes32 claimId
) external view returns (uint256);
```
Query claimable compensation amount:
- `claimId`: Compensation claim ID
- Returns: Claimable compensation amount

### Admin Configuration

```solidity
function initialize(
    address _zkService,
    address _configManager,
    address _arbitratorManager,
    address _signatureValidationService
) external;
```
Initialize compensation manager:
- `_zkService`: Transaction and signature ZK service address, for validating illegal signature compensation
- `_configManager`: Config manager address
- `_arbitratorManager`: Arbitrator manager address
- `_signatureValidationService`: Signature validation ZK service address, for validating failed arbitration compensation

```solidity
function setZkService(address _zkService) external;
function setTransactionManager(address _transactionManager) external;
function setConfigManager(address _configManager) external;
function setArbitratorManager(address _arbitratorManager) external;
function setSignatureValidationService(address _signatureValidationService) external;
```
Set key interface addresses

### Events

```solidity
// Compensation claim events
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

// Compensation withdrawal events
event CompensationWithdrawn(
    bytes32 indexed claimId,
    address indexed claimer,
    address indexed receivedCompensationAddress,
    uint256 ethAmount,
    uint256[] nftTokenIds,
    uint256 systemFee,
    uint256 excessPaymenttoClaimer
);

// Admin configuration events
event ZkServiceUpdated(address indexed newZkService);
event TransactionManagerUpdated(address indexed newTransactionManager);
event ConfigManagerUpdated(address indexed newConfigManager);
event ArbitratorManagerUpdated(address indexed newArbitratorManager);
event SignatureValidationServiceUpdated(address indexed newSignatureValidationService);
```

### Data Structures

```solidity
struct CompensationClaim {
    address claimer;              // Claimer address
    address arbitrator;           // Arbitrator address
    uint256 ethAmount;           // ETH compensation amount
    address nftContract;         // NFT contract address
    uint256[] nftTokenIds;       // NFT token ID list
    uint256 totalAmount;         // Total compensation amount
    bool withdrawn;              // Whether withdrawn
    CompensationType claimType;  // Compensation type
    address receivedCompensationAddress;  // Compensation receiver address
}

enum CompensationType {
    IllegalSignature,   // Illegal signature
    Timeout,           // Timeout
    FailedArbitration, // Failed arbitration
    ArbitratorFee      // Arbitrator fee
}
```

## Features
- Illegal Signature Compensation Management
- Timeout Compensation Management
- Failed Arbitration Compensation Management
- Arbitrator Fee Compensation Management
- Compensation Calculation and Distribution
- Compensation Claim Status Tracking

## Workflow

### 1. Illegal Signature Compensation Process
1. Detect illegal signature submission by the arbitrator
2. Prepare evidence (e.g., proof of signature verification failure)
3. Submit a compensation claim with the arbitrator's address and evidence
4. Wait for claim review
5. Withdraw compensation after approval

### 2. Timeout Compensation Process
1. Transaction exceeds the deadline
2. Submit a timeout compensation claim with the transaction ID
3. System automatically verifies timeout status
4. Withdraw compensation after verification

### 3. Failed Arbitration Compensation Process
1. Detect an error in the arbitration result
2. Collect evidence of the error
3. Submit a failed arbitration compensation claim
4. Wait for claim review
5. Withdraw compensation after approval

### 4. Arbitrator Fee Compensation Process
1. Arbitrator submits valid signature
2. Lock period passes
3. Transaction not completed
4. Submit an arbitrator fee compensation claim
5. Withdraw compensation after verification

## Security Considerations
1. Evidence verification mechanism to prevent false claims
2. Compensation amount cap control
3. Duplicate claim check
4. Authorization verification for secure withdrawal
5. Status tracking to prevent duplicate withdrawals

## Interaction with Other Components
1. TransactionManager: Retrieve transaction information and status
2. ArbitratorManager: Verify arbitrator information
3. ConfigManager: Retrieve compensation-related configurations
4. DAppRegistry: Verify DApp status

## Best Practices
1. Submit compensation claims promptly
2. Provide sufficient evidence support
3. Save compensation claim ID
4. Regularly check compensation status
5. Verify the correctness of the compensation amount

## Usage Examples

### Example 1: Apply for Illegal Signature Compensation
```javascript
// 1. Prepare evidence
const evidence = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
        ["bytes", "bytes"],
        [btcTx, invalidSignature]
    )
);

// 2. Submit compensation claim
const claimId = await compensationManager.claimIllegalSignatureCompensation(
    arbitratorAddress,
    evidence
);

// 3. Query compensation amount
const amount = await compensationManager.getClaimableAmount(claimId);

// 4. Withdraw compensation
if (amount > 0) {
    await compensationManager.withdrawCompensation(claimId);
}
```

### Example 2: Apply for Timeout Compensation
```javascript
// 1. Submit timeout compensation claim
const claimId = await compensationManager.claimTimeoutCompensation(txId);

// 2. Query compensation amount
const amount = await compensationManager.getClaimableAmount(claimId);

// 3. Withdraw compensation
if (amount > 0) {
    await compensationManager.withdrawCompensation(claimId);
}
```

### Example 3: Apply for Failed Arbitration Compensation
```javascript
// 1. Prepare evidence
const evidence = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "string"],
        [txId, "Arbitration result conflicts with on-chain state"]
    )
);

// 2. Submit compensation claim
const claimId = await compensationManager.claimFailedArbitrationCompensation(
    evidence
);

// 3. Query and withdraw compensation
const amount = await compensationManager.getClaimableAmount(claimId);
if (amount > 0) {
    await compensationManager.withdrawCompensation(claimId);
}
```

### Example 4: Apply for Arbitrator Fee Compensation
```javascript
// 1. Submit arbitrator fee compensation claim
const claimId = await compensationManager.claimArbitratorFee(txId);

// 2. Query compensation amount
const amount = await compensationManager.getClaimableAmount(claimId);

// 3. Withdraw compensation
if (amount > 0) {
    await compensationManager.withdrawCompensation(claimId);
}
```