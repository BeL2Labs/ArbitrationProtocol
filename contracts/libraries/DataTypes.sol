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
        Submitted,
        ToBeActive
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

    struct ArbitratorBasicInfo {
        address arbitrator;        // Arbitrator's Ethereum address
        bool paused;              // Whether the arbitrator is paused
        uint256 registerTime;     // Registration timestamp
        uint256 deadline;         // Validity period deadline
    }

    struct ArbitratorOperationInfo {
        address operator;         // Operator's address
        bytes operatorBtcPubKey;  // Operator's BTC public key
        string operatorBtcAddress;// Operator's BTC address
        bytes32 activeTransactionId; // Current active transaction ID
        uint256 lastSubmittedWorkTime; // Last work submission timestamp
    }

    struct ArbitratorRevenueInfo {
        uint256 currentFeeRate;    // ETH fee rate
        uint256 currentBTCFeeRate; // BTC fee rate
        bytes revenueBtcPubKey;    // BTC public key for receiving revenue
        string revenueBtcAddress;  // BTC address for receiving revenue
        address revenueETHAddress; // ETH address for receiving revenue
    }

    struct ArbitratorAssets {
        uint256 ethAmount;          // ETH balance
        address erc20Token;         // ERC20 token address
        uint256 erc20Amount;        // ERC20 token balance
        address nftContract;        // NFT contract address
        uint256[] nftTokenIds;      // NFT token IDs
    }

    struct TransactionData {
        uint256 startTime;         // Transaction start time
        uint256 deadline;          // Transaction deadline
        uint256 requestArbitrationTime;  // Time when arbitration was requested
        uint256 depositedFee;      // Deposited arbitration fee
        TransactionStatus status;  // Current transaction status
        uint256 arbitratorBtcFee; // Arbitrator's BTC fee
        string btcFeeAddress;     // BTC address for fee payment
        bytes32 btcFeeTxHash;     // BTC transaction hash for fee payment
    }

    struct TransactionParties {
        address dapp;                          // DApp address
        address arbitrator;                    // Arbitrator address
        address compensationReceiver;          // Compensation receiver address
        address timeoutCompensationReceiver;   // Timeout compensation receiver address
        address refundAddress;                 // Refund address
        address depositedFeeRefundAddress;     // Deposited fee refund address
    }

    struct ZKVerification {
        uint256 status;           // Verification status
        bytes pubKey;             // Public key
        bytes32 txHash;           // Transaction hash (sign hash of the raw data)
        bytes signature;          // Signature
        bool verified;            // Whether verification is complete
        UTXO[] utxos;            // Array of UTXOs
    }

    struct ArbitrationData {
        bytes32 id;               // Arbitration ID
        bytes rawData;           // Raw transaction data
        DataTypes.SignDataType signDataType;  // Signature data type
        uint8 signHashFlag;      // Signature hash flag
        bytes script;            // Script data
        address timeoutCompensationReceiver;  // Timeout compensation receiver address
    }
}