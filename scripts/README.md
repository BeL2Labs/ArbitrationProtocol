# Transaction Scripts

This directory contains scripts to interact with the TransactionManager contract.

## Scripts

### registerTransaction.js
Script to register a new transaction in the TransactionManager contract.

#### Usage
```bash
npx hardhat run scripts/registerTransaction.js --network <your-network>
```

#### Parameters
- `arbitratorAddress`: The address of the arbitrator managing the transaction
- `deadline`: Unix timestamp for transaction deadline
- `compensationReceiverAddress`: Address to receive compensation in case of timeout

### completeTransaction.js
Script to complete an existing transaction in the TransactionManager contract.

#### Usage
```bash
npx hardhat run scripts/completeTransaction.js --network <your-network>
```

#### Parameters
- `transactionId`: Unique identifier of the transaction to be completed

### requestArbitration.js
Script to request arbitration for a specific transaction.

#### Usage
```bash
npx hardhat run scripts/requestArbitration.js --network <your-network>
```

#### Parameters
- `transactionId`: Unique identifier of the transaction
- `btcTx`: Bitcoin transaction data
- `timeoutCompensationReceiver`: Address to receive compensation

### submitArbitration.js
Script to submit arbitration for a specific transaction.

#### Usage
```bash
npx hardhat run scripts/submitArbitration.js --network <your-network>
```

#### Parameters
- `transactionId`: Unique identifier of the transaction
- `signature`: Arbitration signature

### getTransactionById.js
Script to retrieve detailed information about a specific transaction.

#### Usage
```bash
npx hardhat run scripts/getTransactionById.js --network <your-network>
```

#### Parameters
- `transactionId`: Unique identifier of the transaction to retrieve

#### Output
Provides comprehensive details about the transaction, including:
- DApp address
- Arbitrator address
- Deadline
- Deposited fee
- Transaction status
- Compensation receiver details
- BTC transaction information (if available)

## General Notes
- Ensure you have sufficient ETH to cover transaction fees
- Verify network and contract address before running scripts
- Only authorized parties can perform specific contract actions
- Check transaction and contract state before executing scripts
