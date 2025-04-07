// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library BytesLib {

    // VarInt max value for 1 byte encoding
    uint256 constant VARINT_SINGLE_BYTE = 0xfc;
    // VarInt prefix for 2 byte encoding
    uint8 constant VARINT_TWO_BYTES = 0xfd;
    // VarInt prefix for 4 byte encoding
    uint8 constant VARINT_FOUR_BYTES = 0xfe;
    // VarInt prefix for 8 byte encoding
    uint8 constant VARINT_EIGHT_BYTES = 0xff;

    /// @notice 从小端字节序读取uint32
    /// @param data 源数据
    /// @param offset 起始位置
    /// @return 转换后的uint32值
    function readUint32LE(bytes calldata data, uint256 offset) internal pure returns (uint32) {
        return uint32(uint8(data[offset])) |
               (uint32(uint8(data[offset + 1])) << 8) |
               (uint32(uint8(data[offset + 2])) << 16) |
               (uint32(uint8(data[offset + 3])) << 24);
    }

    /// @notice 从小端字节序读取uint64
    /// @param data 源数据
    /// @param offset 起始位置
    /// @return 转换后的uint64值
    function readUint64LE(bytes calldata data, uint256 offset) internal pure returns (uint64) {
        return uint64(readUint32LE(data, offset)) |
               (uint64(readUint32LE(data, offset + 4)) << 32);
    }

    /// @notice 将uint32转换为小端字节序
    /// @param value 要转换的值
    /// @param data 目标字节数组
    /// @param offset 写入位置
    /// @return newOffset 新的偏移量
    function writeUint32LE(uint32 value, bytes memory data, uint256 offset) internal pure returns (uint256) {
        data[offset] = bytes1(uint8(value));
        data[offset + 1] = bytes1(uint8(value >> 8));
        data[offset + 2] = bytes1(uint8(value >> 16));
        data[offset + 3] = bytes1(uint8(value >> 24));
        return offset + 4;
    }

    /// @notice 将uint64转换为小端字节序
    /// @param value 要转换的值
    /// @param data 目标字节数组
    /// @param offset 写入位置
    /// @return newOffset 新的偏移量
    function writeUint64LE(uint64 value, bytes memory data, uint256 offset) internal pure returns (uint256) {
        offset = writeUint32LE(uint32(value), data, offset);
        return writeUint32LE(uint32(value >> 32), data, offset);
    }

    /// @notice 读取比特币格式的哈希值（32字节，需要反转）
    /// @param data 源数据
    /// @param offset 起始位置
    /// @return 反转后的哈希值
    function readBitcoinHash(bytes calldata data, uint256 offset) internal pure returns (bytes32) {
        bytes32 hash;
        for(uint i = 0; i < 32; i++) {
            hash |= bytes32(uint256(uint8(data[offset + 31 - i]))) << (i * 8);
        }
        return hash;
    }

    /// @notice 写入比特币格式的哈希值（32字节，需要反转）
    /// @param hash 原始哈希值（已经是正确顺序）
    /// @param data 目标字节数组
    /// @param offset 写入位置
    /// @return newOffset 新的偏移量
    function writeBitcoinHash(bytes32 hash, bytes memory data, uint256 offset) internal pure returns (uint256) {
        for(uint i = 0; i < 32; i++) {
            data[offset + i] = hash[i];
        }
        return offset + 32;
    }

    /// @notice 反转比特币哈希值的字节序
    /// @param hash 要反转的哈希值
    /// @return 反转后的哈希值
    function reverseBitcoinHash(bytes32 hash) internal pure returns (bytes32) {
        bytes32 result;
        for (uint256 i = 0; i < 32; i++) {
            result |= bytes32(uint256(uint8(hash[i])) << (i * 8));
        }
        return result;
    }

    /// @notice 计算比特币格式的双重SHA256（结果需要反转）
    /// @param data 要哈希的数据
    /// @return 反转后的双重SHA256哈希值
    function doubleSha256Bitcoin(bytes memory data) internal pure returns (bytes32) {
        bytes32 hash = sha256(abi.encodePacked(sha256(data)));
        return reverseBitcoinHash(hash);
    }

    /// @notice 读取可变长度整数
    /// @param data 数据源
    /// @param offset 起始位置
    /// @return value 读取的值
    /// @return length length of var int
    function readVarInt(bytes calldata data, uint256 offset) internal pure returns (uint256 value, uint256 length) {
        uint8 first = uint8(data[offset]);
        if (first < 0xfd) {
            return (first, 1);
        } else if (first == 0xfd) {
            return (
                uint256(uint8(data[offset + 1])) | (uint256(uint8(data[offset + 2])) << 8),
                3
            );
        } else if (first == 0xfe) {
            return (
                uint256(readUint32LE(data, offset + 1)),
                5
            );
        } else {
            return (
                uint256(readUint64LE(data, offset + 1)),
                9
            );
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
            data[offset + 1] = valueBytes[1];
            data[offset + 2] = valueBytes[0];
            return 3;
        } else if (value <= 0xffffffff) {
            data[offset] = bytes1(VARINT_FOUR_BYTES);
            bytes4 valueBytes = bytes4(uint32(value));
            for (uint256 i = 0; i < 4; i++) {
                data[offset + 1 + i] = valueBytes[3 - i];
            }
            return 5;
        } else {
            data[offset] = bytes1(VARINT_EIGHT_BYTES);
            bytes8 valueBytes = bytes8(uint64(value));
            for (uint256 i = 0; i < 8; i++) {
                data[offset + 1 + i] = valueBytes[7 - i];
            }
            return 9;
        }
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

    function equal(bytes memory _preBytes, bytes memory _postBytes) internal pure returns (bool) {
        bool success = true;

        assembly {
            let length := mload(_preBytes)

        // if lengths don't match the arrays are not equal
            switch eq(length, mload(_postBytes))
            case 1 {
            // cb is a circuit breaker in the for loop since there's
            // no said feature for inline assembly loops
            // cb = 1 - don't breaker
            // cb = 0 - break
                let cb := 1

                let mc := add(_preBytes, 0x20)
                let end := add(mc, length)

                for {
                    let cc := add(_postBytes, 0x20)
                // the next line is the loop condition:
                // while(uint(mc < end) + cb == 2)
                } eq(add(lt(mc, end), cb), 2) {
                    mc := add(mc, 0x20)
                    cc := add(cc, 0x20)
                } {
                // if any of these checks fails then arrays are not equal
                    if iszero(eq(mload(mc), mload(cc))) {
                    // unsuccess:
                        success := 0
                        cb := 0
                    }
                }
            }
            default {
            // unsuccess:
                success := 0
            }
        }

        return success;
    }

    function contains(bytes memory _bytes, bytes memory _substr) internal pure returns (bool) {
        if (_substr.length == 0) {
            return true;
        }
        if (_bytes.length < _substr.length) {
            return false;
        }
        if (_bytes.length == _substr.length) {
            return equal(_bytes, _substr);
        }
        for (uint i = 0; i <= _bytes.length - _substr.length; i++) {
            bool found = true;
            for (uint j = 0; j < _substr.length; j++) {
                if (_bytes[i + j] != _substr[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return true;
            }
        }
        return false;
    }

}
