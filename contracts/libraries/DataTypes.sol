// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library DataTypes {
    enum ArbitratorStatus {
        Active,     // Arbitrator is available for new transactions
        Working,    // Arbitrator is currently working on a transaction
        Paused,     // Arbitrator is temporarily paused
        Terminated  // Arbitrator has been terminated
    }

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
        Disputed
    }

    enum CompensationType {
        IllegalSignature,
        TimeoutPenalty
    }

    struct ArbitratorInfo {
        address arbitrator;        // Arbitrator Ethereum address
        uint256 currentFeeRate;    // Current fee rate
        uint256 pendingFeeRate;    // Pending new fee rate
        ArbitratorStatus status;   // Arbitrator status
        bytes32 activeTransactionId; // Current transaction ID
        uint256 ethAmount;         // ETH stake amount
        address erc20Token;        // ERC20 token address
        address nftContract;       // NFT contract address
        uint256[] nftTokenIds;     // NFT token IDs
        address operator;          // Operator address
        bytes operatorBtcPubKey;   // Bitcoin public key
        string operatorBtcAddress; // Bitcoin address
        uint256 lastArbitrationTime; // Last arbitration time
        bytes revenueBtcPubKey;   // Bitcoin public key for receiving arbitrator earnings
        string revenueBtcAddress; // Bitcoin address for receiving arbitrator earnings
        address revenueETHAddress; // ETH address for receiving arbitrator earnings
    }

    struct Transaction {
        address dapp;
        address arbitrator;
        uint256 startTime;
        uint256 deadline;
        bytes btcTx;               // Unsigned Bitcoin transaction
        bytes32 btcTxHash;         // Hash of the Bitcoin transaction with empty input scripts
        TransactionStatus status;
        uint256 depositedFee;
        bytes signature;           // Arbitrator's signature
        address compensationReceiver;           // Compensation receiver address
        address timeoutCompensationReceiver;    // Timeout compensation receiver address
    }

    struct ArbitrationRequest {
        uint256 txId;
        address requester;
        uint256 requestTime;
        uint256 deadline;
        address timeoutCompensationReceiver;
        bool fulfilled;
    }
}