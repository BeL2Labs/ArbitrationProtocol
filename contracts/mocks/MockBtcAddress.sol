// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IBtcAddress.sol";

contract MockBtcAddress is IBtcAddress {
    mapping(string => bytes) public btc_address_to_script;
    mapping(bytes => string) public script_to_btc_address;

    function setBtcAddressToScript(string memory btc_address, bytes memory script) public {
        btc_address_to_script[btc_address] = script;
        script_to_btc_address[script] = btc_address;
    }

    function decodeAddress(string memory btc_address) external view returns(bytes memory, BtcAddressType) {
        return (btc_address_to_script[btc_address], BtcAddressType.EMPTY);
    }

    function DecodeBtcAddressToScript(string memory btc_address) external view returns(bytes memory) {
        return btc_address_to_script[btc_address];
    }

    function EncodeSegWitAddress(bytes memory script, string memory network) external view returns(string memory) {
        network = network;
        return script_to_btc_address[script];
    }    
}
