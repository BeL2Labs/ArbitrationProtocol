// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBTCUtils {
    struct BTCInput {
        bytes32 txid;        // Previous transaction hash
        uint32 vout;        // Output index in previous transaction
        bytes scriptSig;    // Input script
        uint32 sequence;    // Sequence number
    }

    struct BTCOutput {
        uint64 value;       // Amount in satoshis
        bytes scriptPubKey; // Output script
    }

    struct BTCTransaction {
        uint32 version;     // Transaction version
        BTCInput[] inputs;  // Transaction inputs
        BTCOutput[] outputs; // Transaction outputs
        uint32 locktime;    // Transaction locktime
        bool hasWitness;    // Whether the transaction has witness data
    }

    function parseBTCTransaction(bytes calldata rawTx) external pure returns (BTCTransaction memory);
    
    function generateWitnessSignData(
        BTCTransaction memory btcTx,
        uint32 inputIndex,
        bytes memory script,
        uint64 amount,
        uint8 sigHashFlag
    ) external pure returns (bytes memory);

    function IsValidDERSignature(bytes calldata signature) external pure returns (bool);

    /// @notice Calculate transaction ID (double SHA256)
    /// @dev For witness transactions, exclude witness data
    /// @param txData Raw transaction data
    /// @return Transaction ID
    function calculateTxId(bytes calldata txData) external pure returns (bytes32);

    /**
     * @notice Verify if the lockScript is valid and matches the expected owner
     * @param lockScript The witness script to verify
     * @param expectedOwner The expected owner address
     * @param utxoScript The P2WSH script from UTXO
     * @return isExpected True if the script is valid and matches the owner
     */
    function isExpectLockScript(
        bytes calldata lockScript,
        address expectedOwner,
        bytes calldata utxoScript
    ) external pure returns (bool isExpected);
}
