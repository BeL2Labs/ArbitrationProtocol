// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITokenWhitelist {
    // Events
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);
    
    /**
     * @dev Add a token to the whitelist
     * @param token Address of the token to be added
     */
    function addToken(address token) external;
    
    /**
     * @dev Remove a token from the whitelist
     * @param token Address of the token to be removed
     */
    function removeToken(address token) external;
    
    /**
     * @dev Check if a token is whitelisted
     * @param token Address of the token to check
     * @return bool True if the token is whitelisted, false otherwise
     */
    function isWhitelisted(address token) external view returns (bool);
    
    /**
     * @dev Add multiple tokens to the whitelist
     * @param tokens Array of token addresses to be added
     */
    function addTokens(address[] calldata tokens) external;
}
