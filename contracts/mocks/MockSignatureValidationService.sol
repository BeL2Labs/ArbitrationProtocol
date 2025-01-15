// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISignatureValidationService.sol";
import "../libraries/DataTypes.sol";

contract MockSignatureValidationService {

    struct ValidationData {
        bytes32 msghash;
        uint8 signType;
        bytes signature;
        bytes pubkey;
        bool verified;
    }

    mapping(bytes32 => ValidationData) data;

    // Submits arbitration-related data for verification to the ZK service.
    function submit(
        bytes32 msghash,
        uint8 signType, // 0 is ECDSA, 1 is Schnorr
        bytes calldata signature, // if ECDSA it's DER encoded signature
        bytes calldata pubkey
    ) external payable returns (bytes32) {
        bytes32 id = keccak256(abi.encodePacked(msghash, signType, signature, pubkey));
        data[id] = ValidationData({
            msghash: msghash,
            signType: signType,
            signature: signature,
            pubkey: pubkey,
            verified: true
        });

        return id;
    }

    function getResult(bytes32 id) external view returns (
        bool verified,
        bytes32 msghash,
        bytes memory signature,
        bytes memory pubkey
    ) {
        ValidationData memory ret = data[id];
        return (ret.verified, ret.msghash, ret.signature, ret.pubkey);
    }

    function submitFailedData(bytes32 msghash,
        uint8 signType,
        bytes calldata signature,
        bytes calldata pubkey
    ) external payable returns (bytes32) {
        bytes32 id = keccak256(abi.encodePacked(msghash, signType, signature, pubkey));
        data[id] = ValidationData({
            msghash: msghash,
            signType: signType,
            signature: signature,
            pubkey: pubkey,
            verified: false
        });

        return id;
    }
}
