// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/BTCUtils.sol";

contract TestBTCUtils {
    using BTCUtils for bytes;

    function testParseBTCTransaction(bytes calldata txBytes) external pure returns (BTCUtils.BTCTransaction memory) {
        return BTCUtils.parseBTCTransaction(txBytes);
    }
}
