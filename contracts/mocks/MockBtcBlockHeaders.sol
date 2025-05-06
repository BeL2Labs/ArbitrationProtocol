// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IBtcBlockHeaders.sol";

contract MockBtcBlockHeaders is IBtcBlockHeaders {
    mapping(uint32 => BlockHeader) private headers;
    uint32 private _lastHeight;

    function setBlockHeader(
        uint32 _height,
        uint32 _version,
        bytes32 _prevBlockHash,
        bytes32 _merkleRoot,
        uint32 _timestamp,
        uint32 _bits,
        uint32 _nonce,
        bytes32 _blockHash
    ) external {
        headers[_height] = BlockHeader({
            version: _version,
            prevBlockHash: _prevBlockHash,
            merkleRoot: _merkleRoot,
            timestamp: _timestamp,
            bits: _bits,
            nonce: _nonce,
            blockHash: _blockHash,
            height: _height
        });

        if (_height > _lastHeight) {
            _lastHeight = _height;
        }
    }

    function getBlockByHeight(uint32 _height) external view returns (BlockHeader memory) {
        require(headers[_height].blockHash != bytes32(0), "Block not found");
        return headers[_height];
    }

    function lastHeight() external view returns (uint32) {
        return _lastHeight;
    }
}
