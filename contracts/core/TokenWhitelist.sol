// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/ITokenWhitelist.sol";

/**
 * @title TokenWhitelist
 * @dev Contract for managing whitelisted ERC20 tokens
 */
contract TokenWhitelist is ITokenWhitelist, Ownable {
    // Mapping to store whitelisted token addresses
    mapping(address => bool) private _whitelistedTokens;

    constructor() Ownable(msg.sender) {}
        
    /**
     * @dev Add a token to the whitelist
     * @param token Address of the token to be added
     */
    function addToken(address token) external override onlyOwner {
        require(token != address(0), "TokenWhitelist: Invalid token address");
        require(!_whitelistedTokens[token], "TokenWhitelist: Token already whitelisted");
        
        _whitelistedTokens[token] = true;
        emit TokenAdded(token);
    }
    
    /**
     * @dev Remove a token from the whitelist
     * @param token Address of the token to be removed
     */
    function removeToken(address token) external override onlyOwner {
        require(_whitelistedTokens[token], "TokenWhitelist: Token not whitelisted");
        
        _whitelistedTokens[token] = false;
        emit TokenRemoved(token);
    }
    
    /**
     * @dev Check if a token is whitelisted
     * @param token Address of the token to check
     * @return bool True if the token is whitelisted, false otherwise
     */
    function isWhitelisted(address token) public view override returns (bool) {
        return _whitelistedTokens[token];
    }
    
    /**
     * @dev Add multiple tokens to the whitelist
     * @param tokens Array of token addresses to be added
     */
    function addTokens(address[] calldata tokens) external override onlyOwner {
        for (uint256 i = 0; i < tokens.length; i++) {
            require(tokens[i] != address(0), "TokenWhitelist: Invalid token address");
            if (!_whitelistedTokens[tokens[i]]) {
                _whitelistedTokens[tokens[i]] = true;
                emit TokenAdded(tokens[i]);
            }
        }
    }
}
