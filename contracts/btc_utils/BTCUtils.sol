// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/Errors.sol";
import "../libraries/BytesLib.sol";
import "../interfaces/IBTCUtils.sol";

contract BTCUtils is IBTCUtils {
    using BytesLib for bytes;

    // Bitcoin transaction version is 4 bytes
    uint256 constant VERSION_SIZE = 4;
    // Segwit marker
    uint8 constant SEGWIT_MARKER = 0x00;
    // Segwit flag
    uint8 constant SEGWIT_FLAG = 0x01;

    uint8 constant SIGHASH_ALL = 0x01;
    uint8 constant SIGHASH_NONE = 0x02;
    uint8 constant SIGHASH_SINGLE = 0x03;
    uint8 constant SIGHASH_ANYONECANPAY = 0x80;

    /**
     * @notice Parse Bitcoin transaction, handling both legacy and witness formats
     * @param txBytes Raw transaction bytes
     * @return transaction Parsed transaction data
     */
    function parseBTCTransaction(bytes calldata txBytes) external pure override returns (BTCTransaction memory transaction) {
        uint256 offset = 0;
        uint256 txLength = txBytes.length;

        // Parse version (4 bytes)
        if (offset + VERSION_SIZE > txLength) revert (Errors.INVALID_BTC_TX);
        transaction.version = BytesLib.readUint32LE(txBytes, offset);
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
        if (offset + 4 > txLength) revert (Errors.INVALID_BTC_TX);
        transaction.locktime = uint32(bytes4(txBytes[offset:offset + 4]));
        offset += 4;

        // Ensure we've parsed the entire transaction
        if (offset != txLength) revert (Errors.INVALID_BTC_TX);
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
        (uint256 inputCount, uint256 inputCountSize) = BytesLib.readVarInt(txBytes, offset);
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
        (uint256 outputCount, uint256 outputCountSize) = BytesLib.readVarInt(txBytes, offset);
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
            (uint256 witnessCount, uint256 witnessCountSize) = BytesLib.readVarInt(txBytes, newOffset);
            newOffset += witnessCountSize;
            for (uint256 j = 0; j < witnessCount; j++) {
                (uint256 itemSize, uint256 itemSizeSize) = BytesLib.readVarInt(txBytes, newOffset);
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
        totalSize += BytesLib.getVarIntSize(btcTx.inputs.length);  // Input count
        for (uint256 i = 0; i < btcTx.inputs.length; i++) {
            totalSize += 40;  // txid (32) + vout (4) + sequence (4)
            totalSize += 1;   // Empty script length
        }
        totalSize += BytesLib.getVarIntSize(btcTx.outputs.length);  // Output count
        for (uint256 i = 0; i < btcTx.outputs.length; i++) {
            totalSize += 8;  // value
            totalSize += BytesLib.getVarIntSize(btcTx.outputs[i].scriptPubKey.length);
            totalSize += btcTx.outputs[i].scriptPubKey.length;
        }
        totalSize += 4;  // locktime

        bytes memory result = new bytes(totalSize);
        uint256 offset = 0;

        // Version
        bytes4 versionBytes = bytes4(uint32(btcTx.version));
        for (uint256 i = 0; i < 4; i++) {
            result[offset + i] = versionBytes[3 - i];
        }
        offset += 4;

        // Input count
        offset += BytesLib.writeVarInt(btcTx.inputs.length, result, offset);

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
                result[offset + j] = voutBytes[3 - j];
            }
            offset += 4;

            // Empty script
            result[offset] = 0x00;  // script length = 0
            offset += 1;

            // sequence
            bytes4 seqBytes = bytes4(btcTx.inputs[i].sequence);
            for (uint256 j = 0; j < 4; j++) {
                result[offset + j] = seqBytes[3 - j];
            }
            offset += 4;
        }

        // Output count
        offset += BytesLib.writeVarInt(btcTx.outputs.length, result, offset);

        // Outputs
        for (uint256 i = 0; i < btcTx.outputs.length; i++) {
            // value
            bytes8 valueBytes = bytes8(btcTx.outputs[i].value);
            for (uint256 j = 0; j < 8; j++) {
                result[offset + j] = valueBytes[7 - j];
            }
            offset += 8;

            // scriptPubKey
            offset += BytesLib.writeVarInt(btcTx.outputs[i].scriptPubKey.length, result, offset);
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
     * @notice Parse Bitcoin transaction input
     * @param data Raw data
     * @param offset Current offset in data
     * @return input Parsed input
     * @return size Size of input in bytes
     */
    function parseInput(bytes calldata data, uint256 offset) internal pure returns (BTCInput memory input, uint256 size) {
        uint256 startOffset = offset;

        // Parse txid (32 bytes)
        if (offset + 32 > data.length) revert (Errors.INVALID_BTC_TX);
        input.txid = reverseTxid(bytes32(data[offset:offset + 32]));
        offset += 32;

        // Parse vout (4 bytes)
        if (offset + 4 > data.length) revert (Errors.INVALID_BTC_TX);
        input.vout = BytesLib.readUint32LE(data, offset);
        offset += 4;

        // Parse scriptSig
        (uint256 scriptLength, uint256 scriptLengthSize) = BytesLib.readVarInt(data, offset);
        offset += scriptLengthSize;
        if (offset + scriptLength > data.length) revert (Errors.INVALID_BTC_TX);
        input.scriptSig = data[offset:offset + scriptLength];
        offset += scriptLength;

        // Parse sequence (4 bytes)
        if (offset + 4 > data.length) revert (Errors.INVALID_BTC_TX);
        input.sequence = BytesLib.readUint32LE(data, offset);
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
        if (offset + 8 > data.length) revert (Errors.INVALID_BTC_TX);
        output.value = BytesLib.readUint64LE(data, offset);
        offset += 8;

        // Parse scriptPubKey
        (uint256 scriptLength, uint256 scriptLengthSize) = BytesLib.readVarInt(data, offset);
        offset += scriptLengthSize;
        if (offset + scriptLength > data.length) revert (Errors.INVALID_BTC_TX);
        output.scriptPubKey = data[offset:offset + scriptLength];
        offset += scriptLength;

        return (output, offset - startOffset);
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

    /**
     * @notice Parse Bitcoin witness sign data
     * @param signData sign data bytes
     * @return transaction Parsed transaction data
     */
    function parseWitnessSignData(bytes calldata signData) internal pure returns (BTCTransaction memory transaction) {
        uint256 offset = 0;
        uint256 txLength = signData.length;

        // Parse version (4 bytes)
        if (offset + VERSION_SIZE > txLength) revert (Errors.INVALID_BTC_TX);
        transaction.version = BytesLib.readUint32LE(signData, offset);
        offset += VERSION_SIZE;

        // skip hashPrevouts
        if (offset + 32 > txLength) revert (Errors.INVALID_BTC_TX);
        offset += 32;

        // skip hashSequence
        if (offset + 32 > txLength) revert (Errors.INVALID_BTC_TX);
        offset += 32;

        transaction.inputs = new BTCInput[](1);
        // Parse txid (32 bytes)
        if (offset + 32 > txLength) revert (Errors.INVALID_BTC_TX);
        transaction.inputs[0].txid = reverseTxid(bytes32(signData[offset:offset + 32]));
        offset += 32;

        // Parse vout (4 bytes)
        if (offset + 4 > txLength) revert (Errors.INVALID_BTC_TX);
        transaction.inputs[0].vout = BytesLib.readUint32LE(signData, offset);
        offset += 4;

        // Parse scriptSig
        (uint256 scriptLength, uint256 scriptLengthSize) = BytesLib.readVarInt(signData, offset);
        offset += scriptLengthSize;
        if (offset + scriptLength > txLength) revert (Errors.INVALID_BTC_TX);
        transaction.inputs[0].scriptSig = signData[offset:offset + scriptLength];
        offset += scriptLength;

        // skip amount
        if (offset + 8 > txLength) revert (Errors.INVALID_BTC_TX);
        offset += 8;

        // Parse sequence (4 bytes)
        if (offset + 4 > txLength) revert (Errors.INVALID_BTC_TX);
        transaction.inputs[0].sequence = BytesLib.readUint32LE(signData, offset);
        offset += 4;

        // skip hashOutputs
        if (offset + 32 > txLength) revert (Errors.INVALID_BTC_TX);
        offset += 32;

        // Parse locktime (4 bytes)
        if (offset + 4 > txLength) revert (Errors.INVALID_BTC_TX);
        transaction.locktime = uint32(bytes4(signData[offset:offset + 4]));
        offset += 4;

        // last 4 bytes is hash type
        if (offset + 4 != txLength) revert (Errors.INVALID_BTC_TX);
    }

    function IsValidDERSignature(bytes calldata signature) external pure returns (bool) {
        // Minimum length for a DER signature is 8 bytes
        // 0x30 + length + 0x02 + r_length + r + 0x02 + s_length + s
        if (signature.length < 8) return false;

        // Check sequence format (0x30)
        if (uint8(signature[0]) != 0x30) return false;

        // Check total length matches
        uint256 totalLen = uint8(signature[1]);
        if (totalLen + 2 != signature.length) return false;

        // Position for R value
        uint256 rPos = 2;
        // Check R marker (0x02)
        if (uint8(signature[rPos]) != 0x02) return false;

        // Get R length
        uint256 rLen = uint8(signature[rPos + 1]);
        // R value cannot be zero length
        if (rLen == 0) return false;
        // Check if R length is valid
        if (rLen > 33 || rPos + 2 + rLen >= signature.length) return false;
        // Check R padding
        if (rLen > 1 && uint8(signature[rPos + 2]) == 0x00 && uint8(signature[rPos + 3]) < 0x80) return false;

        // Position for S value
        uint256 sPos = rPos + 2 + rLen;
        // Check S marker (0x02)
        if (uint8(signature[sPos]) != 0x02) return false;

        // Get S length
        uint256 sLen = uint8(signature[sPos + 1]);
        // S value cannot be zero length
        if (sLen == 0) return false;
        // Check if S length is valid
        if (sLen > 33 || sPos + 2 + sLen > signature.length) return false;
        // Check S padding
        if (sLen > 1 && uint8(signature[sPos + 2]) == 0x00 && uint8(signature[sPos + 3]) < 0x80) return false;

        // Total length check
        if (totalLen != (2 + rLen + 2 + sLen)) return false;

        return true;
    }

    function getOutputSerializeLength(BTCOutput memory output) internal pure returns (uint256) {
        return 8 + BytesLib.getVarIntSize(output.scriptPubKey.length) + output.scriptPubKey.length;
    }

    function serializeOutput(BTCOutput memory output, bytes memory data, uint256 offset) internal pure returns (uint256) {
        offset = BytesLib.writeUint64LE(output.value, data, offset);
        offset += BytesLib.writeVarInt(output.scriptPubKey.length, data, offset);
        for (uint256 i = 0; i < output.scriptPubKey.length; i++) {
            data[offset + i] = output.scriptPubKey[i];
        }
        return offset + output.scriptPubKey.length;
    }

    /**
     * @notice Generate witness sign data for Bitcoin transaction
     * @param btcTx Bitcoin transaction data
     * @param inputIndex Index of the input to generate sign data for
     * @param amount Amount of the input
     * @param sigHashFlag Signature hash flag (SIGHASH_ALL = 0x01, SIGHASH_NONE = 0x02, SIGHASH_SINGLE = 0x03, SIGHASH_ANYONECANPAY = 0x80)
     * @return bytes The generated sign data
     */
    function generateWitnessSignData(
        BTCTransaction memory btcTx,
        uint32 inputIndex,
        bytes memory script,
        uint64 amount,
        uint8 sigHashFlag
    ) external pure returns (bytes memory) {
        if (inputIndex >= btcTx.inputs.length) revert(Errors.INVALID_INPUT_INDEX);

        // Handle different sighash flags
        bool anyoneCanPay = (sigHashFlag & SIGHASH_ANYONECANPAY) == SIGHASH_ANYONECANPAY;
        uint32 baseSighashType = sigHashFlag & 0x1f;

        // Calculate total size
        uint256 totalSize = 4; // version
        totalSize += 32; // hashPrevouts
        totalSize += 32; // hashSequence
        totalSize += 32; // outpoint (txid)
        totalSize += 4;  // outpoint (vout)
        totalSize += BytesLib.getVarIntSize(script.length);
        totalSize += script.length; // scriptSig
        totalSize += 8;  // amount
        totalSize += 4;  // sequence
        totalSize += 32; // hashOutputs
        totalSize += 4;  // locktime
        totalSize += 4;  // sighashType

        // Allocate memory
        bytes memory signData = new bytes(totalSize);
        uint256 offset = 0;

        // Write version
        offset = BytesLib.writeUint32LE(btcTx.version, signData, offset);

        // Calculate and write hashPrevouts
        if (!anyoneCanPay) {
            bytes memory prevouts = new bytes(36 * btcTx.inputs.length);
            uint256 prevOutOffset = 0;
            for (uint256 i = 0; i < btcTx.inputs.length; i++) {
                bytes32 txid = BytesLib.reverseBitcoinHash(btcTx.inputs[i].txid);
                prevOutOffset = BytesLib.writeBitcoinHash(txid, prevouts, prevOutOffset);
                prevOutOffset = BytesLib.writeUint32LE(btcTx.inputs[i].vout, prevouts, prevOutOffset);
            }
            bytes32 hashPrevouts = sha256(abi.encodePacked(sha256(prevouts)));
            BytesLib.writeBitcoinHash(hashPrevouts, signData, offset);
        }
        offset += 32;

        // Calculate and write hashSequence
        if (!anyoneCanPay && baseSighashType != SIGHASH_NONE && baseSighashType != SIGHASH_SINGLE) {
            bytes memory sequences = new bytes(4 * btcTx.inputs.length);
            uint256 sequnceOffset = 0;
            for (uint256 i = 0; i < btcTx.inputs.length; i++) {
                sequnceOffset = BytesLib.writeUint32LE(btcTx.inputs[i].sequence, sequences, sequnceOffset);
            }
            bytes32 hashSequence = sha256(abi.encodePacked(sha256(sequences)));
            BytesLib.writeBitcoinHash(hashSequence, signData, offset);
        }
        offset += 32;

        // Write outpoint (txid and vout)
        offset = BytesLib.writeBitcoinHash(BytesLib.reverseBitcoinHash(btcTx.inputs[inputIndex].txid), signData, offset);
        offset = BytesLib.writeUint32LE(btcTx.inputs[inputIndex].vout, signData, offset);

        // Write script
        offset += BytesLib.writeVarInt(script.length, signData, offset);
        for (uint256 i = 0; i < script.length; i++) {
            signData[offset + i] = script[i];
        }
        offset += script.length;

        // Write amount
        offset = BytesLib.writeUint64LE(amount, signData, offset);

        // Write sequence
        offset = BytesLib.writeUint32LE(btcTx.inputs[inputIndex].sequence, signData, offset);

        // Calculate and write hashOutputs
        if (baseSighashType != SIGHASH_NONE && baseSighashType != SIGHASH_SINGLE) {
            uint256 outputsSize = 0;
            for (uint256 i = 0; i < btcTx.outputs.length; i++) {
                outputsSize += getOutputSerializeLength(btcTx.outputs[i]);
            }
            bytes memory outputs = new bytes(outputsSize);
            uint256 outputsOffset = 0;
            for (uint256 i = 0; i < btcTx.outputs.length; i++) {
                outputsOffset = serializeOutput(btcTx.outputs[i], outputs, outputsOffset);
            }
            bytes32 hashOutputs = sha256(abi.encodePacked(sha256(outputs)));
            BytesLib.writeBitcoinHash(hashOutputs, signData, offset);
        } else if (baseSighashType == SIGHASH_SINGLE && inputIndex < btcTx.outputs.length) {
            bytes memory output = new bytes(getOutputSerializeLength(btcTx.outputs[inputIndex]) );
            serializeOutput(btcTx.outputs[inputIndex], output, 0);
            bytes32 hashOutput = sha256(abi.encodePacked(sha256(output)));
            BytesLib.writeBitcoinHash(hashOutput, signData, offset);
        }
        offset += 32;

        // Write locktime
        offset = BytesLib.writeUint32LE(btcTx.locktime, signData, offset);

        // Write sighash type
        offset = BytesLib.writeUint32LE(sigHashFlag, signData, offset);

        require(offset == signData.length, "Invalid sign data length");

        return signData;
    }

    /// @notice Calculate transaction ID (double SHA256)
    /// @dev For witness transactions, exclude witness data
    /// @param txData Raw transaction data
    /// @return Transaction ID
    function calculateTxId(bytes calldata txData) external pure returns (bytes32) {
        // If witness transaction, construct non-witness data
        if (txData[4] == 0x00 && txData[5] == 0x01) {
            uint256 inputCount;
            uint256 offset = 6;
            (inputCount, offset) = BytesLib.readVarInt(txData, offset);

            // Skip all inputs
            for(uint256 i = 0; i < inputCount; i++) {
                (, offset) = parseInputs(txData, offset);
            }

            // Read and skip all outputs
            uint256 outputCount;
            (outputCount, offset) = BytesLib.readVarInt(txData, offset);
            for(uint256 i = 0; i < outputCount; i++) {
                (, offset) = parseOutputs(txData, offset);
            }

            // Construct non-witness data
            bytes memory nonWitnessData = new bytes(4 + (offset - 6) + 4);
            uint256 pos = 0;

            // Copy version
            pos = BytesLib.writeUint32LE(BytesLib.readUint32LE(txData, 0), nonWitnessData, pos);

            // Copy input and output data (skip witness flag and version)
            for(uint256 i = 6; i < offset; i++) {
                nonWitnessData[pos++] = txData[i];
            }

            // Copy locktime
            uint256 lockTimeOffset = txData.length - 4;
            BytesLib.writeUint32LE(BytesLib.readUint32LE(txData, lockTimeOffset), nonWitnessData, pos);

            // Calculate double SHA256 and return in correct byte order
            return BytesLib.doubleSha256Bitcoin(nonWitnessData);
        }

        // Non-witness transaction, calculate directly
        return BytesLib.doubleSha256Bitcoin(txData);
    }
}
