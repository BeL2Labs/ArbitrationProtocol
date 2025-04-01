// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BytesLib.sol";

library MerkleVerifier {
    using BytesLib for bytes;

    /// @notice Verify if a transaction is included in the merkle tree
    /// @param txHash Transaction hash
    /// @param merkleRoot Merkle tree root
    /// @param proof Merkle proof path
    /// @param index Transaction position in the tree
    /// @return Whether the transaction is included
    function verifyMerkleProof(
        bytes32 txHash,
        bytes32 merkleRoot,
        bytes32[] calldata proof,
        uint256 index
    ) internal pure returns (bool) {
        bytes32 currentHash = txHash;
        uint256 currentIndex = index;

        // Start with the transaction hash and calculate merkle root using the proof
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            
            // If index is even, hash(current || proof)
            // If index is odd, hash(proof || current)
            if (currentIndex % 2 == 0) {
                currentHash = hashPair(currentHash, proofElement);
            } else {
                currentHash = hashPair(proofElement, currentHash);
            }
            
            // Move to parent level
            currentIndex = currentIndex / 2;
        }

        // Verify calculated root matches provided root
        return currentHash == merkleRoot;
    }

    /// @notice Calculate parent hash of two child hashes
    /// @param left Left child hash
    /// @param right Right child hash
    /// @return Parent hash
    function hashPair(bytes32 left, bytes32 right) internal pure returns (bytes32) {
        // Bitcoin's merkle tree uses double SHA256
        bytes memory combined = new bytes(64);
        
        // Write left and right child nodes (note Bitcoin's byte order)
        for (uint i = 0; i < 32; i++) {
            combined[i] = left[31 - i];        // Reverse left node byte order
            combined[i + 32] = right[31 - i];  // Reverse right node byte order
        }
        
        // Calculate double SHA256
        return BytesLib.doubleSha256Bitcoin(combined);
    }

    function getMerkleProof(
        bytes32 txHash,
        bytes32[] calldata proof,
        uint256 index
    ) internal pure returns (bytes32) {
        bytes32 currentHash = txHash;
        uint256 currentIndex = index;

        // Start with the transaction hash and calculate merkle root using the proof
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            // If index is even, hash(current || proof)
            // If index is odd, hash(proof || current)
            if (currentIndex % 2 == 0) {
                currentHash = hashPair(currentHash, proofElement);
            } else {
                currentHash = hashPair(proofElement, currentHash);
            }

            // Move to parent level
            currentIndex = currentIndex / 2;
        }

        // Verify calculated root matches provided root
        return currentHash;
    }
}
