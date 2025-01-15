// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IZkService.sol";
import "../libraries/DataTypes.sol";
import "hardhat/console.sol";

contract MockZkService is IZkService {
    // Mapping to store mock verification data
    mapping(bytes32 => DataTypes.ZKVerification) private _verifications;
    mapping(bytes32 => DataTypes.UTXO[]) private _utxos;
    
    /**
     * @dev Set up a mock verification with specified parameters
     */
    function setValidVerification(
        bytes32 evidence,
        bytes memory pubKey,
        bytes32 signHash,
        bytes memory signature,
        DataTypes.UTXO[] calldata utxos
    ) external {
        DataTypes.ZKVerification storage verification = _verifications[evidence];
        verification.status = 0;
        verification.verified = true;
        verification.pubKey = pubKey;
        verification.txHash = signHash;
        verification.signature = signature;
        delete verification.utxos;
        for (uint256 i = 0; i < utxos.length; i++) {
            verification.utxos.push(utxos[i]);
        }
    }

    /**
     * @dev Set verification status to false
     */
    function setInvalidVerification(
        bytes32 evidence,
        uint256 status,
        bytes memory pubKey,
        bytes32 signHash,
        bytes memory signature,
        DataTypes.UTXO[] calldata utxos
    ) external {
        DataTypes.ZKVerification storage verification = _verifications[evidence];
        verification.verified = false;
        verification.pubKey = pubKey;
        verification.txHash = signHash;
        verification.signature = signature;
        verification.status = status;
        delete verification.utxos;
        for (uint256 i = 0; i < utxos.length; i++) {
            verification.utxos.push(utxos[i]);
        }
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
        verification.pubKey = "0x1234";
        verification.txHash = keccak256("test");
        verification.signature = "0x5678";
        verification.verified = true;
        verification.status = 0;
    }

    function setEmptyPubKey(bytes32 evidence) external {
        DataTypes.ZKVerification storage verification = _verifications[evidence];
        verification.pubKey = "";
        verification.txHash = keccak256("test");
        verification.signature = "0x5678";
        verification.verified = true;
        verification.status = 0;
    }

    function setEmptyTxHash(bytes32 evidence) external {
        DataTypes.ZKVerification storage verification = _verifications[evidence];
        verification.pubKey = "0x5678";
        verification.txHash = bytes32(0);
        verification.signature = "0x9012";
        verification.verified = true;
        verification.status = 0;
    }

    function submitArbitration(
        bytes calldata  pubKey,
        bytes calldata rawData,
        bytes[] calldata utxos,
        uint256 inputIndex,
        uint256 signatureIndex
    ) external payable returns (bytes32) {
        bytes32 evidence = sha256(rawData);
        DataTypes.ZKVerification storage verification = _verifications[evidence];
        verification.pubKey = pubKey;
        verification.txHash = evidence;
        verification.signature = "0x5678";
        verification.verified = true;
        verification.status = 0;
        for(uint i = 0; i < utxos.length; i++) {
        }
        console.log("inputIndex", inputIndex);
        console.log("signatureIndex", signatureIndex);

        return evidence;
    }

    function fee() external pure override returns (uint256) {
        return 0;
    }
}
