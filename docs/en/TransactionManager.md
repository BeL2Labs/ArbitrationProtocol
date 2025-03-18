# Transaction Manager

## Overview
The TransactionManager is a core component in the arbitration protocol responsible for managing the lifecycle of cross-chain transactions. It handles transaction registration, UTXO uploads, arbitration request processing, signature submission, and integrates closely with the compensation system to handle exceptions.

## Core Functions

### 1. Transaction Registration and Management

```solidity
function registerTransaction(
    address arbitrator,
    uint256 deadline,
    address compensationReceiver,
    address refundAddress
) external payable returns (bytes32 id);
```
Registers a new transaction.
- `arbitrator`: Selected arbitrator address
- `deadline`: Transaction deadline timestamp
- `compensationReceiver`: Address to receive compensation if needed
- `refundAddress`: Address to receive refunds
- `msg.value`: Must equal the required registration fee, can be queried via `getRegisterTransactionFee`
- Returns: Unique transaction ID

```solidity
function uploadUTXOs(
    bytes32 id,
    DataTypes.UTXO[] calldata utxos
) external;
```
Uploads UTXO data for a transaction, can only be uploaded once.
- `id`: Transaction ID
- `utxos`: UTXO data array

```solidity
function completeTransaction(bytes32 id) external;
```
Marks a transaction as completed.

```solidity
function completeTransactionWithSlash(bytes32 id, address receivedCompensationAddress) external;
```
Marks a transaction as completed with arbitrator slashing and sends compensation to the specified address. Only callable by CompensationManager.

```solidity
function isAbleCompletedTransaction(bytes32 id) external view returns (bool);
```
Checks if a transaction can be completed.

### 2. Arbitration Functions

```solidity
function requestArbitration(
    DataTypes.ArbitrationData calldata data
) external;
```
Requests arbitration for a transaction. UTXO data must be uploaded first.
- `data`: Arbitration data containing transaction ID, raw data, script, and other informationout compensation

```solidity
function submitArbitration(
    bytes32 id,
    bytes calldata btcTxSignature
) external;
```
Submits arbitration result with signature, only callable by the arbitrator.
- `id`: Transaction ID
- `btcTxSignature`: Signature of the signData

### 3. Query Functions

```solidity
function getTransactionDataById(bytes32 id) external view returns (DataTypes.TransactionData memory);
function getTransactionDataByTxHash(bytes32 txHash) external view returns (DataTypes.TransactionData memory);
function getTransactionStatus(bytes32 id) external view returns (DataTypes.TransactionStatus);
function getTransactionPartiesById(bytes32 id) external view returns (DataTypes.TransactionParties memory);
function getTransactionPartiesByTxHash(bytes32 txHash) external view returns (DataTypes.TransactionParties memory);
function getTransactionUTXOsById(bytes32 id) external view returns (DataTypes.UTXO[] memory);
function getTransactionSignatureById(bytes32 id) external view returns (bytes memory);
function getTransactionSignatureByTxHash(bytes32 txHash) external view returns (bytes memory);
function getTransactionBtcRawDataById(bytes32 id) external view returns (bytes memory);
function getTransactionSignHashById(bytes32 id) external view returns (bytes32);
function txHashToId(bytes32 txHash) external view returns (bytes32);
```
Functions to query transaction information:
- `getTransactionDataById`/`getTransactionDataByTxHash`: Get basic transaction data
- `getTransactionStatus`: Get transaction status
- `getTransactionPartiesById`/`getTransactionPartiesByTxHash`: Get transaction parties information
- `getTransactionUTXOsById`: Get transaction UTXO data
- `getTransactionSignatureById`/`getTransactionSignatureByTxHash`: Get transaction signature
- `getTransactionBtcRawDataById`: Get transaction raw data
- `getTransactionSignHashById`: Get transaction signature hash
- `txHashToId`: Convert transaction hash to ID

```solidity
function getRegisterTransactionFee(uint256 deadline, address arbitrator) external view returns (uint256 fee);
```
Calculates the required fee for registering a transaction.

### 4. Fee Management

```solidity
function transferArbitrationFee(
    bytes32 id
) external returns (uint256 arbitratorFee, uint256 systemFee);
```
Transfers arbitration fees to arbitrator and system.
- Only callable by CompensationManager
- Returns both arbitrator and system fee amounts

### 5. Configuration

```solidity
function setArbitratorManager(address _arbitratorManager) external;
function setBTCAddressParser(address _btcAddressParser) external;
```
System configuration functions:
- `setArbitratorManager`: Set arbitrator manager address
- `setBTCAddressParser`: Set BTC address parser address

## Event System

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
    bytes rawData,
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

event BTCAddressParserChanged(
    address indexed newParser
);

event DepositFeeTransfer(
    bytes32 indexed txId,
    address indexed revenueETHAddress,
    uint256 arbitratorFee,
    uint256 systemFee,
    uint256 refundedFee
);
```

## Workflow

### 1. Normal Flow
1. DApp registers transaction
   - Select arbitrator and set deadline
   - Pay required fees
   - Set compensation receiver address
   - Get transaction ID

2. Upload UTXO data
   - Provide transaction-related UTXO information
   - Can only be uploaded once

3. Request arbitration
   - Provide data to be signed and script
   - Specify signature data type
   - Set timeout compensation receiver

4. Arbitrator signs
   - Verify transaction content
   - Generate signature
   - Submit signature

5. Complete transaction
   - Complete normally or with slashing
   - Update status
   - Handle fee distribution

### 2. Exception Handling Flow
1. Arbitrator timeout
   - Request timeout compensation through compensation manager
   - Compensation sent to specified compensation receiver

2. Illegal signature
   - Request illegal signature compensation through compensation manager
   - Provide evidence
   - Compensation sent to timeout compensation receiver specified during arbitration request

3. Wrong signature
   - Request wrong signature compensation through compensation manager
   - Provide evidence
   - Compensation sent to compensation receiver specified during registration

## Usage Examples

### Example 1: DApp Transaction Registration
```javascript
// 1. Calculate required fee
const deadline = Math.floor(Date.now() / 1000) + 24 * 3600; // 24 hours later
const fee = await transactionManager.getRegisterTransactionFee(
    deadline,
    arbitratorAddress
);

// 2. Register transaction
const tx = await transactionManager.registerTransaction(
    arbitratorAddress,
    deadline,
    compensationReceiver,
    refundAddress,
    { value: fee }
);
const receipt = await tx.wait();

// 3. Get transaction ID
const txId = receipt.events.find(e => e.event === 'TransactionRegistered').args.id;

// 4. Upload UTXO data
await transactionManager.uploadUTXOs(txId, utxos);
```

### Example 2: Request Arbitration
```javascript
// 1. Prepare signature data
    const transactionId = "0x..."; // Transaction ID
    const btcTx = "0x..."; // Transaction data
    const signData = "0x..."; // Data to be signed
    const script = "0x..."; // Script data
    const timeoutCompensationReceiver = "0x..."; // Timeout compensation    receiver (ETH address)

    const arbitrationData = {
        id: transactionId,
        rawData: btcTx,
        signDataType: 0, // Corresponds to SignDataType.Witness
        signHashFlag: 0, // Default hash flag
        script: "", // Default unlock script
        timeoutCompensationReceiver: timeoutCompensationReceiver
    };

// 2. Request arbitration
await transactionManager.requestArbitration(
    arbitrationData
);
```

### Example 3: Arbitrator Submits Signature
```javascript
// 1. Generate signature
const signature = "0x..."; // Bitcoin transaction signature

// 2. Submit signature
await transactionManager.submitArbitration(
    txId,
    signature
);
```

## Error Handling
The contract will throw errors in the following situations:
- Transaction already exists
- Transaction not found
- UTXO already uploaded
- Unauthorized arbitrator
- Insufficient fee
- Transaction expired
- Invalid status
- Insufficient permissions

## Security Considerations
1. Use cryptographically secure hashes for transaction IDs
2. UTXO data can only be uploaded once
3. Multi-layer compensation mechanisms to protect user rights
4. Deadline mechanism to prevent indefinite transaction suspension
5. Fee mechanism to prevent spam transactions
6. Status checks to prevent duplicate operations

## Interaction with Other Components
1. ArbitratorManager: Verify arbitrator status and permissions
2. DAppRegistry: Verify DApp registration status
3. ConfigManager: Retrieve system configuration parameters
4. CompensationManager: Handle compensation and slashing

## Best Practices
1. Calculate accurate fees before registering transactions
2. Upload UTXO data promptly
3. Set reasonable deadlines
4. Configure compensation receiver addresses correctly
5. Verify signature data correctness before requesting arbitration
6. Handle timeouts and errors promptly
7. Keep transaction status updated in a timely manner