// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/DataTypes.sol";
/**
 * @title IZkService
 * @notice Interface for ZK service verification
 */
interface IZkService {
    /**
     * @notice Get raw data, public key, UTXOs, and verify signature for a given id
     * @param id The ID to query
     * @return rawData The raw data associated with the ID
     * @return utxos Array of Unspent Transaction Outputs (UTXOs) associated with the transaction
     * @return pubKey The public key associated with the ID
     * @return hash The hash of the standard rawdata
     * @return signature The signature associated with the ID
     * @return verified Whether the signature is verified
     */
    function getZkVerification(bytes32 id) external view returns (
        bytes memory rawData,
        DataTypes.UTXO[] memory utxos,
        bytes memory pubKey,
        bytes32 hash,
        bytes memory signature,
        bool verified
    );
}
