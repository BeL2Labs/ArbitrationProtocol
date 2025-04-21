// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAssetOracle.sol";

contract MockAssetOracle is IAssetOracle {

    constructor() {
    }

    function assetPrices(address asset) external pure override returns(uint256) {
        if(asset== 0xDF4191Bfe8FAE019fD6aF9433E8ED6bfC4B90CA1) {//btc
            return 79465735198732349079552;
        }
        if(asset== 0x0daddd286487f3a03Ea9A1b693585fD46cdCcF9F) {//usdt
            return 1000000000000000000;
        }
        if(asset== 0x517E9e5d46C1EA8aB6f78677d6114Ef47F71f6c4) {//ela
            return 2691927811995680256;
        }
        if(asset == 0xA06be0F5950781cE28D965E5EFc6996e88a8C141) {//usdc
            return 1000230934041853184;
        }
        return 2691927811995680256;
    }
}
