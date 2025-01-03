// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/BTCUtils.sol";

contract TestBTCUtils {
    using BTCUtils for bytes;

    function testParseBTCTransaction(bytes calldata txBytes) external pure returns (bytes memory, bytes32) {
        BTCUtils.BTCTransaction memory transaction = BTCUtils.parseBTCTransaction(txBytes);
        bytes memory rawData = BTCUtils.serializeBTCTransaction(transaction);
        bytes32 hash = sha256(rawData);
        return (rawData, hash);
    }

    function parseBTCTransaction(bytes calldata txBytes) external pure returns (BTCUtils.BTCTransaction memory) {
        BTCUtils.BTCTransaction memory transaction = BTCUtils.parseBTCTransaction(txBytes);
        return transaction;
    }
}
