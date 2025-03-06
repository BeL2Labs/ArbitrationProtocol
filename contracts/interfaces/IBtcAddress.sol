// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

enum BtcAddressType {
    EMPTY,
    P2WPKH,//Native Segwit
    P2WSH,//payToWitnessScriptHashScript
    P2SH,  //Nested Segwit
    P2TR, //Taproot
    P2PK, // payToPubKeyScript
    P2PKH//Legacy
}

interface IBtcAddress {
    function decodeAddress(string memory btc_address) external view returns(bytes memory, BtcAddressType);
    function DecodeBtcAddressToScript(string memory btc_address) external view returns(bytes memory);

    function EncodeSegWitAddress(bytes memory script, string memory network) external view returns(string memory);
}
