// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockNFTInfo {
    struct NFTInfo {
        string name;
        string description;
    }

    mapping(uint256 => NFTInfo) public nftInfos;

    function setNFTInfo(uint256 tokenId, string memory name, string memory description) public {
        nftInfos[tokenId] = NFTInfo(name, description);
    }

    function getNFTInfo(uint256 tokenId) public view returns (string memory, string memory) {
        NFTInfo memory info = nftInfos[tokenId];
        return (info.name, info.description);
    }
}
