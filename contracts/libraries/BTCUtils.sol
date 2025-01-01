// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Errors.sol";

/**
 * @title BTCUtils
 * @notice Utility library for parsing and handling Bitcoin transactions
 */
library BTCUtils {
    // Bitcoin transaction version is 4 bytes
    uint256 constant VERSION_SIZE = 4;
    // VarInt max value for 1 byte encoding
    uint256 constant VARINT_SINGLE_BYTE = 0xfc;
    // VarInt prefix for 2 byte encoding
    uint8 constant VARINT_TWO_BYTES = 0xfd;
    // VarInt prefix for 4 byte encoding
    uint8 constant VARINT_FOUR_BYTES = 0xfe;
    // VarInt prefix for 8 byte encoding
    uint8 constant VARINT_EIGHT_BYTES = 0xff;
    // Segwit marker
    uint8 constant SEGWIT_MARKER = 0x00;
    // Segwit flag
    uint8 constant SEGWIT_FLAG = 0x01;

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

    /**
     * @notice Parse Bitcoin transaction, handling both legacy and witness formats
     * @param txBytes Raw transaction bytes
     * @return transaction Parsed transaction data
     */
    function parseBTCTransaction(bytes calldata txBytes) internal pure returns (BTCTransaction memory transaction) {
        uint256 offset = 0;
        uint256 txLength = txBytes.length;

        // Parse version (4 bytes)
        if (offset + VERSION_SIZE > txLength) revert Errors.INVALID_BTC_TX();
        transaction.version = uint32(bytes4(txBytes[offset:offset + VERSION_SIZE]));
        offset += VERSION_SIZE;

        // Check for segwit marker and flag
        (bool hasWitness, uint256 newOffset) = checkWitness(txBytes, offset);
        transaction.hasWitness = hasWitness;
        offset = newOffset;


        // Parse inputs
        (BTCInput[] memory inputs, uint256 inputsOffset) = parseInputs(txBytes, offset);
        transaction.inputs = inputs;
        offset = inputsOffset;

        // Parse outputs
        (BTCOutput[] memory outputs, uint256 outputsOffset) = parseOutputs(txBytes, offset);
        transaction.outputs = outputs;
        offset = outputsOffset;

        // Skip witness data if present
        if (hasWitness) {
            offset = skipWitnessData(txBytes, offset, inputs.length);
        }

        // Parse locktime (4 bytes)
        if (offset + 4 > txLength) revert Errors.INVALID_BTC_TX();
        transaction.locktime = uint32(bytes4(txBytes[offset:offset + 4]));
        offset += 4;

        // Ensure we've parsed the entire transaction
        if (offset != txLength) revert Errors.INVALID_BTC_TX();
    }

    /**
     * @notice Check if transaction has witness data
     * @param txBytes Raw transaction bytes
     * @param offset Current offset in data
     * @return hasWitness Whether transaction has witness data
     * @return newOffset Updated offset
     */
    function checkWitness(bytes calldata txBytes, uint256 offset) internal pure returns (bool hasWitness, uint256 newOffset) {
        newOffset = offset;
        if (offset + 2 <= txBytes.length) {
            uint8 marker = uint8(txBytes[offset]);
            uint8 flag = uint8(txBytes[offset + 1]);
            if (marker == SEGWIT_MARKER && flag == SEGWIT_FLAG) {
                hasWitness = true;
                newOffset += 2;
            }
        }
    }

    /**
     * @notice Parse transaction inputs
     * @param txBytes Raw transaction bytes
     * @param offset Current offset in data
     * @return inputs Array of parsed inputs
     * @return newOffset Updated offset
     */
    function parseInputs(bytes calldata txBytes, uint256 offset) internal pure returns (BTCInput[] memory inputs, uint256 newOffset) {
        (uint256 inputCount, uint256 inputCountSize) = parseVarInt(txBytes, offset);
        newOffset = offset + inputCountSize;

        inputs = new BTCInput[](inputCount);
        for (uint256 i = 0; i < inputCount; i++) {
            (BTCInput memory input, uint256 inputSize) = parseInput(txBytes, newOffset);
            inputs[i] = input;
            newOffset += inputSize;
        }
    }

    /**
     * @notice Parse transaction outputs
     * @param txBytes Raw transaction bytes
     * @param offset Current offset in data
     * @return outputs Array of parsed outputs
     * @return newOffset Updated offset
     */
    function parseOutputs(bytes calldata txBytes, uint256 offset) internal pure returns (BTCOutput[] memory outputs, uint256 newOffset) {
        (uint256 outputCount, uint256 outputCountSize) = parseVarInt(txBytes, offset);
        newOffset = offset + outputCountSize;

        outputs = new BTCOutput[](outputCount);
        for (uint256 i = 0; i < outputCount; i++) {
            (BTCOutput memory output, uint256 outputSize) = parseOutput(txBytes, newOffset);
            outputs[i] = output;
            newOffset += outputSize;
        }
    }

    /**
     * @notice Skip witness data in transaction
     * @param txBytes Raw transaction bytes
     * @param offset Current offset in data
     * @param inputCount Number of inputs
     * @return newOffset Updated offset
     */
    function skipWitnessData(bytes calldata txBytes, uint256 offset, uint256 inputCount) internal pure returns (uint256 newOffset) {
        newOffset = offset;
        for (uint256 i = 0; i < inputCount; i++) {
            (uint256 witnessCount, uint256 witnessCountSize) = parseVarInt(txBytes, newOffset);
            newOffset += witnessCountSize;
            for (uint256 j = 0; j < witnessCount; j++) {
                (uint256 itemSize, uint256 itemSizeSize) = parseVarInt(txBytes, newOffset);
                newOffset += itemSizeSize + itemSize;
            }
        }
    }

    /**
     * @notice Serialize Bitcoin transaction with empty input scripts
     * @param btcTx Transaction to serialize
     * @return Raw transaction bytes
     */
    function serializeBTCTransaction(BTCTransaction memory btcTx) internal pure returns (bytes memory) {
        // Calculate total size
        uint256 totalSize = VERSION_SIZE;  // Version
        totalSize += getVarIntSize(btcTx.inputs.length);  // Input count
        for (uint256 i = 0; i < btcTx.inputs.length; i++) {
            totalSize += 40;  // txid (32) + vout (4) + sequence (4)
            totalSize += 1;   // Empty script length
        }
        totalSize += getVarIntSize(btcTx.outputs.length);  // Output count
        for (uint256 i = 0; i < btcTx.outputs.length; i++) {
            totalSize += 8;  // value
            totalSize += getVarIntSize(btcTx.outputs[i].scriptPubKey.length);
            totalSize += btcTx.outputs[i].scriptPubKey.length;
        }
        totalSize += 4;  // locktime

        bytes memory result = new bytes(totalSize);
        uint256 offset = 0;

        // Version
        bytes4 versionBytes = bytes4(uint32(btcTx.version));
        for (uint256 i = 0; i < 4; i++) {
            result[offset + i] = versionBytes[i];
        }
        offset += 4;

        // Input count
        offset += writeVarInt(btcTx.inputs.length, result, offset);

        // Inputs
        for (uint256 i = 0; i < btcTx.inputs.length; i++) {
            // txid
            for (uint256 j = 0; j < 32; j++) {
                result[offset + j] = btcTx.inputs[i].txid[31 - j];
            }
            offset += 32;

            // vout
            bytes4 voutBytes = bytes4(btcTx.inputs[i].vout);
            for (uint256 j = 0; j < 4; j++) {
                result[offset + j] = voutBytes[j];
            }
            offset += 4;

            // Empty script
            result[offset] = 0x00;  // script length = 0
            offset += 1;

            // sequence
            bytes4 seqBytes = bytes4(btcTx.inputs[i].sequence);
            for (uint256 j = 0; j < 4; j++) {
                result[offset + j] = seqBytes[j];
            }
            offset += 4;
        }

        // Output count
        offset += writeVarInt(btcTx.outputs.length, result, offset);

        // Outputs
        for (uint256 i = 0; i < btcTx.outputs.length; i++) {
            // value
            bytes8 valueBytes = bytes8(btcTx.outputs[i].value);
            for (uint256 j = 0; j < 8; j++) {
                result[offset + j] = valueBytes[j];
            }
            offset += 8;

            // scriptPubKey
            offset += writeVarInt(btcTx.outputs[i].scriptPubKey.length, result, offset);
            for (uint256 j = 0; j < btcTx.outputs[i].scriptPubKey.length; j++) {
                result[offset + j] = btcTx.outputs[i].scriptPubKey[j];
            }
            offset += btcTx.outputs[i].scriptPubKey.length;
        }

        // locktime
        bytes4 locktimeBytes = bytes4(btcTx.locktime);
        for (uint256 i = 0; i < 4; i++) {
            result[offset + i] = locktimeBytes[i];
        }

        return result;
    }

    /**
     * @notice Parse variable integer
     * @param data Raw data
     * @param offset Current offset in data
     * @return value Parsed value
     * @return size Size of varint in bytes
     */
    function parseVarInt(bytes calldata data, uint256 offset) internal pure returns (uint256 value, uint256 size) {
        if (offset >= data.length) revert Errors.INVALID_BTC_TX();
        
        uint8 first = uint8(data[offset]);
        if (first < VARINT_SINGLE_BYTE) {
            return (first, 1);
        } else if (first == VARINT_TWO_BYTES) {
            if (offset + 3 > data.length) revert Errors.INVALID_BTC_TX();
            return (littleEndianToUint16(data, offset + 1), 3);
        } else if (first == VARINT_FOUR_BYTES) {
            if (offset + 5 > data.length) revert Errors.INVALID_BTC_TX();
            return (littleEndianToUint32(data, offset + 1), 5);
        } else {
            if (offset + 9 > data.length) revert Errors.INVALID_BTC_TX();
            return (littleEndianToUint64(data, offset + 1), 9);
        }
    }

    /**
     * @notice Parse Bitcoin transaction input
     * @param data Raw data
     * @param offset Current offset in data
     * @return input Parsed input
     * @return size Size of input in bytes
     */
    function parseInput(bytes calldata data, uint256 offset) internal pure returns (BTCInput memory input, uint256 size) {
        uint256 startOffset = offset;

        // Parse txid (32 bytes)
        if (offset + 32 > data.length) revert Errors.INVALID_BTC_TX();
        input.txid = reverseTxid(bytes32(data[offset:offset + 32]));
        offset += 32;

        // Parse vout (4 bytes)
        if (offset + 4 > data.length) revert Errors.INVALID_BTC_TX();
        input.vout = uint32(bytes4(data[offset:offset + 4]));
        offset += 4;

        // Parse scriptSig
        (uint256 scriptLength, uint256 scriptLengthSize) = parseVarInt(data, offset);
        offset += scriptLengthSize;
        if (offset + scriptLength > data.length) revert Errors.INVALID_BTC_TX();
        input.scriptSig = data[offset:offset + scriptLength];
        offset += scriptLength;

        // Parse sequence (4 bytes)
        if (offset + 4 > data.length) revert Errors.INVALID_BTC_TX();
        input.sequence = uint32(bytes4(data[offset:offset + 4]));
        offset += 4;

        return (input, offset - startOffset);
    }

    /**
     * @notice Parse Bitcoin transaction output
     * @param data Raw data
     * @param offset Current offset in data
     * @return output Parsed output
     * @return size Size of output in bytes
     */
    function parseOutput(bytes calldata data, uint256 offset) internal pure returns (BTCOutput memory output, uint256 size) {
        uint256 startOffset = offset;

        // Parse value (8 bytes)
        if (offset + 8 > data.length) revert Errors.INVALID_BTC_TX();
        output.value = uint64(bytes8(data[offset:offset + 8]));
        offset += 8;

        // Parse scriptPubKey
        (uint256 scriptLength, uint256 scriptLengthSize) = parseVarInt(data, offset);
        offset += scriptLengthSize;
        if (offset + scriptLength > data.length) revert Errors.INVALID_BTC_TX();
        output.scriptPubKey = data[offset:offset + scriptLength];
        offset += scriptLength;

        return (output, offset - startOffset);
    }

    /**
     * @notice Calculate size needed for variable integer
     * @param value Value to encode
     * @return Size in bytes
     */
    function getVarIntSize(uint256 value) internal pure returns (uint256) {
        if (value < VARINT_SINGLE_BYTE) {
            return 1;
        } else if (value <= 0xffff) {
            return 3;
        } else if (value <= 0xffffffff) {
            return 5;
        } else {
            return 9;
        }
    }

    /**
     * @notice Write variable integer to byte array
     * @param value Value to write
     * @param data Target byte array
     * @param offset Current offset in data
     * @return Size of written varint
     */
    function writeVarInt(uint256 value, bytes memory data, uint256 offset) internal pure returns (uint256) {
        if (value < VARINT_SINGLE_BYTE) {
            data[offset] = bytes1(uint8(value));
            return 1;
        } else if (value <= 0xffff) {
            data[offset] = bytes1(VARINT_TWO_BYTES);
            bytes2 valueBytes = bytes2(uint16(value));
            data[offset + 1] = valueBytes[0];
            data[offset + 2] = valueBytes[1];
            return 3;
        } else if (value <= 0xffffffff) {
            data[offset] = bytes1(VARINT_FOUR_BYTES);
            bytes4 valueBytes = bytes4(uint32(value));
            for (uint256 i = 0; i < 4; i++) {
                data[offset + 1 + i] = valueBytes[i];
            }
            return 5;
        } else {
            data[offset] = bytes1(VARINT_EIGHT_BYTES);
            bytes8 valueBytes = bytes8(uint64(value));
            for (uint256 i = 0; i < 8; i++) {
                data[offset + 1 + i] = valueBytes[i];
            }
            return 9;
        }
    }

    /**
     * @notice Convert little endian bytes to uint16 (big endian)
     * @param data The input bytes in little endian
     * @param offset The starting position in the bytes array
     * @return The converted uint16 value
     */
    function littleEndianToUint16(bytes memory data, uint256 offset) internal pure returns (uint16) {
        require(offset + 2 <= data.length, "BTCUtils: insufficient bytes for uint16");
        return uint16(uint8(data[offset + 1])) << 8 | uint16(uint8(data[offset]));
    }

    /**
     * @notice Convert little endian bytes to uint32 (big endian)
     * @param data The input bytes in little endian
     * @param offset The starting position in the bytes array
     * @return The converted uint32 value
     */
    function littleEndianToUint32(bytes memory data, uint256 offset) internal pure returns (uint32) {
        require(offset + 4 <= data.length, "BTCUtils: insufficient bytes for uint32");
        return uint32(uint8(data[offset + 3])) << 24 |
               uint32(uint8(data[offset + 2])) << 16 |
               uint32(uint8(data[offset + 1])) << 8 |
               uint32(uint8(data[offset]));
    }

    /**
     * @notice Convert little endian bytes to uint64 (big endian)
     * @param data The input bytes in little endian
     * @param offset The starting position in the bytes array
     * @return The converted uint64 value
     */
    function littleEndianToUint64(bytes memory data, uint256 offset) internal pure returns (uint64) {
        require(offset + 8 <= data.length, "BTCUtils: insufficient bytes for uint64");
        return uint64(uint8(data[offset + 7])) << 56 |
               uint64(uint8(data[offset + 6])) << 48 |
               uint64(uint8(data[offset + 5])) << 40 |
               uint64(uint8(data[offset + 4])) << 32 |
               uint64(uint8(data[offset + 3])) << 24 |
               uint64(uint8(data[offset + 2])) << 16 |
               uint64(uint8(data[offset + 1])) << 8 |
               uint64(uint8(data[offset]));
    }

    /**
     * @notice Reverse the byte order of a txid
     * @dev Bitcoin txids are typically displayed in big-endian format but internally stored in little-endian
     * @param txid The transaction ID to reverse
     * @return The reversed transaction ID
     */
    function reverseTxid(bytes32 txid) internal pure returns (bytes32) {
        bytes memory temp = new bytes(32);
        for (uint256 i = 0; i < 32; i++) {
            temp[i] = txid[31 - i];
        }
        return bytes32(temp);
    }
}
