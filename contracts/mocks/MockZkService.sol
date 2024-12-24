// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IZkService.sol";
import "../libraries/DataTypes.sol";

contract MockZkService is IZkService {
    // Mapping to store mock verification data
    mapping(bytes32 => DataTypes.ZKVerification) private _verifications;
    mapping(bytes32 => DataTypes.UTXO[]) private _utxos;
    
    /**
     * @dev Set up a mock verification with specified parameters
     */
    function setValidVerification(
        bytes32 evidence,
        bytes memory rawData,
        bytes memory pubKey,
        bytes32 txHash,
        bytes memory signature
    ) external {
        DataTypes.ZKVerification storage verification = _verifications[evidence];
        verification.verified = true;
        verification.rawData = rawData;
        verification.pubKey = pubKey;
        verification.txHash = txHash;
        verification.signature = signature;
    }

    /**
     * @dev Set verification status to false
     */
    function setInvalidVerification(
        bytes32 evidence,
        bytes memory rawData,
        bytes memory pubKey,
        bytes32 txHash,
        bytes memory signature
    ) external {
        DataTypes.ZKVerification storage verification = _verifications[evidence];
        verification.verified = false;
        verification.rawData = rawData;
        verification.pubKey = pubKey;
        verification.txHash = txHash;
        verification.signature = signature;
    }



    /**
     * @dev Retrieve ZK verification data
     */
    function getZkVerification(bytes32 id) external view override returns (DataTypes.ZKVerification memory){
        DataTypes.ZKVerification memory verification = _verifications[id];
        return verification;
    }

    // Additional helper methods for testing scenarios
    function setEmptyRawData(bytes32 evidence) external {
        DataTypes.ZKVerification storage verification = _verifications[evidence];
        verification.rawData = "";
        verification.pubKey = "0x1234";
        verification.txHash = keccak256("test");
        verification.signature = "0x5678";
        verification.verified = true;
    }

    function setEmptyPubKey(bytes32 evidence) external {
        DataTypes.ZKVerification storage verification = _verifications[evidence];
        verification.rawData = "0x1234";
        verification.pubKey = "";
        verification.txHash = keccak256("test");
        verification.signature = "0x5678";
        verification.verified = true;
    }

    function setEmptyTxHash(bytes32 evidence) external {
        DataTypes.ZKVerification storage verification = _verifications[evidence];
        verification.rawData = "0x1234";
        verification.pubKey = "0x5678";
        verification.txHash = bytes32(0);
        verification.signature = "0x9012";
        verification.verified = true;
    }
}
