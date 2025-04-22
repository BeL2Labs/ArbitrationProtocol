# Decentralized Arbitration Protocol

## What is it?

The Decentralized Arbitration Protocol is a trustless guarantee system for Bitcoin transactions. It enables secure Bitcoin transaction execution through a decentralized network of arbiters who stake assets as collateral for their services. The protocol uses zero-knowledge proofs for automated dispute resolution, ensuring fair and transparent handling of transaction conflicts.

## Why use it?

- **Trustless Bitcoin Transactions**: Execute Bitcoin transactions safely without trusting counterparties
- **Automated Guarantees**: Get immediate compensation if transactions go wrong
- **Zero Trust Required**: All enforcement is automated through smart contracts and zero-knowledge proofs
- **DApp Integration**: Easy to integrate with any application needing secure Bitcoin transaction handling
- **Decentralized Security**: Network of independent arbiters with staked assets

## How it works

1. **DApp Registration**
   - DApps apply to use the protocol
   - Application review process ensures quality
   - Once approved, DApp can request arbiters for transactions

2. **Transaction Flow**
   - DApp requests arbiter guarantee for a transaction
   - If transaction completes normally, arbiter isn't involved
   - In disputes, arbiter helps by signing Bitcoin transactions
   - All actions are backed by arbiter's staked assets

3. **Dispute Resolution**
   - If arbiter misbehaves (wrong signature or no response)
   - Victim submits transaction to ZK service for proof
   - Proof submitted to protocol for automated verification
   - Valid claims receive immediate compensation from arbiter's stake

## Technical Architecture

### Core Components

1. **DApp Registry**
   - Application processing
   - DApp verification
   - Access management

2. **Arbiter Management**
   - Arbiter registration with ETH/DPoS NFT/ERC20 staking
   - Bitcoin credential management
   - Performance tracking

3. **Transaction Handling**
   - Bitcoin UTXO processing
   - Arbiter assignment
   - Status tracking

4. **Dispute Resolution**
   - ZK proof verification
   - Automated claim processing
   - Compensation distribution

## Smart Contract Structure

```
contracts/
├── core/                   
│   ├── DAppRegistry.sol      # DApp management
│   ├── ArbitratorManager.sol # Arbiter handling
│   ├── TransactionManager.sol# Transaction processing
│   ├── CompensationManager.sol# Dispute resolution
│   └── ConfigManager.sol      # Configuration management
├── interfaces/            
│   ├── IDAppRegistry.sol
│   ├── IArbitratorManager.sol
│   ├── ITransactionManager.sol
│   ├── ICompensationManager.sol
│   └── IConfigManager.sol
└── libraries/            
    ├── DataTypes.sol
    └── Errors.sol      
```

## Security Features

- Staked Assets: Arbiters must stake ETH or DPoS voting NFTs or ERC20 tokens
- Zero-Knowledge Proofs: Automated verification of claims
- Smart Contract Automation: No manual intervention needed
- Multi-Chain Support: Works across ESC and other EVM chains

## Development

### Requirements
- Solidity ^0.8.20
- Hardhat
- Node.js

### Setup
1. Clone the repository
2. Install dependencies
3. Configure environment
4. Run tests

## Documentation

Detailed documentation available in [docs/](docs/):
- [English Documentation](docs/en/)
- [Chinese Documentation](docs/cn/)

## Contributing

We welcome contributions!

## License

MIT License
