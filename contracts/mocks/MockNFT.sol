// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockNFT is ERC721, Ownable {
    uint256 private _tokenIds;

    constructor() ERC721("MockNFT", "MNFT") Ownable(msg.sender) {}

    function mint(address to) public onlyOwner returns (uint256) {
        _tokenIds++;
        _safeMint(to, _tokenIds);
        return _tokenIds;
    }

    function mintMultiple(address to, uint256 count) public onlyOwner returns (uint256[] memory) {
        uint256[] memory tokenIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            _tokenIds++;
            _safeMint(to, _tokenIds);
            tokenIds[i] = _tokenIds;
        }
        return tokenIds;
    }
}
