// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library DataTypes {

    enum DAppStatus {
        None,
        Pending,
        Active,
        Suspended,
        Terminated
    }

    enum TransactionStatus {
        Active,
        Completed,
        Arbitrated,
        Expired,
        Disputed,
        Submitted
    }

    enum SignDataType {
        NoWitness,
        Witness,
        Taproot
    }

    /**
     * @notice Unspent Transaction Output (UTXO) structure
     * @dev Represents a Bitcoin UTXO with its key identifying information
     * @param txHash Transaction hash where the UTXO was used
     * @param index Output index within the transaction
     * @param script Locking Script the UTXO
     * @param amount Amount of BTC in the UTXO (in satoshis)
     */
    struct UTXO {
        bytes32 txHash;   // Transaction hash
        uint32 index;     // Output index
        bytes script;     // Locking Script
        uint256 amount;   // Amount in satoshis
    }

    struct ArbitratorInfo {
        address arbitrator;        // Arbitrator Ethereum address
        bool paused;               // is paused
        uint256 currentFeeRate;    // Current fee rate
        bytes32 activeTransactionId; // Current transaction ID
        uint256 ethAmount;         // ETH stake amount
        address erc20Token;        // ERC20 token address
        address nftContract;       // NFT contract address
        uint256[] nftTokenIds;     // NFT token IDs
        address operator;          // Operator address
        bytes operatorBtcPubKey;   // Bitcoin public key
        string operatorBtcAddress; // Bitcoin address
        uint256 deadLine; // Last arbitration time , deadline
        bytes revenueBtcPubKey;   // Bitcoin public key for receiving arbitrator earnings
        string revenueBtcAddress; // Bitcoin address for receiving arbitrator earnings
        address revenueETHAddress; // ETH address for receiving arbitrator earnings
        uint256 lastSubmittedWorkTime; // Last submitted work time
    }

    struct Transaction {
        address dapp;
        address arbitrator;
        uint256 startTime;
        uint256 deadline;
        bytes btcTx;               // Unsigned Bitcoin transaction
        bytes32 btcTxHash;         // double sha256 of the signData
        TransactionStatus status;
        uint256 depositedFee;
        bytes signature;           // Arbitrator's signature
        address compensationReceiver;           // Compensation receiver address
        address timeoutCompensationReceiver;    // Timeout compensation receiver address
        UTXO[] utxos;                         // Array of UTXOs associated with the transaction
        bytes script;                         // Bitcoin transaction script
        uint256 requestArbitrationTime;
    }

    struct ZKVerification {
        uint256 status;
        bytes pubKey;
        bytes32 txHash; // sign hash of the raw data
        bytes signature;
        bool verified;
        UTXO[] utxos;
    }

}