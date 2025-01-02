// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library Errors {
    // Common errors
    error ZERO_ADDRESS();
    error NOT_AUTHORIZED();
    error INVALID_PARAMETER();
    error INSUFFICIENT_BALANCE();
    error NOT_TRANSACTION_MANAGER();
    error NOT_ARBITRATOR_MANAGER();
    error NOT_CONFIG_MANAGER();
    error NOT_DAPP_REGISTRY();
    error NOT_INITIALIZED();
    error ALREADY_INITIALIZED();
    error INVALID_DURATION();
    error LENGTH_MISMATCH();

    // DApp related errors
    error DAPP_ALREADY_REGISTERED();
    error DAPP_NOT_REGISTERED();
    error DAPP_NOT_ACTIVE();
    error INVALID_DAPP_STATUS();

    // Transaction related errors
    error TRANSACTION_NOT_FOUND();
    error TRANSACTION_EXPIRED();
    error INVALID_TRANSACTION_STATUS();
    error INVALID_DEADLINE();
    error INVALID_FEE();
    error INSUFFICIENT_FEE();
    error INVALID_TRANSACTION_ID();
    error INVALID_BTC_TX();
    error CANNOT_COMPLETE_TRANSACTION();
    error SUBMITTED_SIGNATURES_OUTTIME();
    error INVALID_UTXO();
    error INVALID_TRANSACTION();

    // Arbitrator related errors
    error ARBITRATOR_ALREADY_REGISTERED();
    error ARBITRATOR_NOT_REGISTERED();
    error ARBITRATOR_NOT_ACTIVE();
    error ARBITRATOR_ALREADY_WORKING();
    error ARBITRATOR_NOT_WORKING();
    error INVALID_STAKE_AMOUNT();
    error INVALID_FEE_RATE();
    error STAKE_STILL_LOCKED();
    error INSUFFICIENT_STAKE();
    error STAKE_EXCEEDS_MAX();
    error INVALID_TOKEN();
    error INVALID_TOKEN_ID();
    error TRANSFER_FAILED();
    error IS_FROZEN();
    error INVALID_OPERATOR();
    error ARBITRATOR_FROZEN();
    error NO_RECEIVE_METHOD();
    error CONFIG_NOT_MODIFIABLE();

    // Config related errors
    error INVALID_CONFIG_KEY();
    error INVALID_CONFIG_VALUE();
    error CONFIG_NOT_FOUND();

    // Operator related errors
    error OPERATOR_ALREADY_REGISTERED();
    error OPERATOR_NOT_REGISTERED();
    error OPERATOR_NOT_AUTHORIZED();
    error NOT_COMPENSATION_MANAGER(string);

    // Compensation related errors
    error EMPTY_RAW_DATA();
    error EMPTY_PUBLIC_KEY();
    error EMPTY_HASH();
    error EMPTY_SIGNATURE();
    error EMPTY_OPERATOR_PUBLIC_KEY();
    error INVALID_ZK_PROOF();
    error TRANSACTION_EXISTS();
    error PUBLIC_KEY_MISMATCH();
    error BTC_TRANSACTION_MISMATCH();
    error NO_STAKE_AVAILABLE();
    error NOT_TRANSACTION_OWNER();
    error NOT_TRANSACTION_ARBITRATOR();
    error TRANSACTION_COMPLETED();
    error DEADLINE_NOT_REACHED();
    error SIGNATURE_ALREADY_SUBMITTED();
    error SIGNATURE_NOT_SUBMITTED();
    error SIGNATURE_MISMATCH();
    error SIGNATURE_VERIFIED();
    error COMPENSATION_WITHDRAWN();
    error NO_COMPENSATION_AVAILABLE();
    error TRANSACTION_NOT_COMPLETED();
    error EMPTY_TOKEN_IDS();
    error INVALID_NFT_CONTRACT();
    error CANNOT_CLAIM_ARBITRATOR_FEE();
    error NO_ACTIVE_TRANSACTION();
    error INVALID_VERIFICATION_DATA();
    error COMPENSATION_ALREADY_CLAIMED();
}