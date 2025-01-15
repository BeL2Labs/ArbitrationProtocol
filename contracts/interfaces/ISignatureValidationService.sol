// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ISignatureValidationService {
    // Submits arbitration-related data for verification to the ZK service.
    function submit(
        bytes32 msghash,
        uint8 signType, // 0 is ECDSA, 1 is Schnorr
        bytes calldata signature, // if ECDSA it's DER encoded signature
        bytes calldata pubkey
    ) external payable returns (bytes32);

    function getResult(bytes32 id) external view returns (
        bool verified,
        bytes32 msghash,
        bytes memory signature,
        bytes memory pubkey
    );

    event submitted(
        bytes32 indexed id,
        bytes32 msghash,
        uint8 signType, // 0 is ECDSA, 1 is Schnorr
        bytes signature, // if ECDSA it's DER encoded signature
        bytes pubkey);

}
