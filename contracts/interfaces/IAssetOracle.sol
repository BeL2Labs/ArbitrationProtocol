// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAssetOracle {
    /**
     * @notice Get current price of specified asset
     * @param asset Asset contract address
     * @return Asset price in USD (18 decimal precision)
     */
    function assetPrices(address asset) external view returns(uint256);
}
