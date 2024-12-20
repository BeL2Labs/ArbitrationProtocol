// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library Errors {
    // Common errors
    string constant ZERO_ADDRESS = "Zero address";
    string constant NOT_AUTHORIZED = "Not authorized";
    string constant INVALID_PARAMETER = "Invalid parameter";
    string constant INSUFFICIENT_BALANCE = "Insufficient balance";
    string constant NOT_TRANSACTION_MANAGER = "Not transaction manager";
    string constant NOT_ARBITRATOR_MANAGER = "Not arbitrator manager";
    string constant NOT_CONFIG_MANAGER = "Not config manager";
    string constant NOT_DAPP_REGISTRY = "Not DApp registry";
    string constant NOT_INITIALIZED = "Not initialized";
    string constant ALREADY_INITIALIZED = "Already initialized";
    string constant INVALID_DURATION = "Invalid duration";
    string constant LENGTH_MISMATCH = "Length mismatch";

    // DApp related errors
    string constant DAPP_ALREADY_REGISTERED = "DApp already registered";
    string constant DAPP_NOT_REGISTERED = "DApp not registered";
    string constant DAPP_NOT_ACTIVE = "DApp not active";
    string constant INVALID_DAPP_STATUS = "Invalid DApp status";

    // Transaction related errors
    string constant TRANSACTION_NOT_FOUND = "Transaction not found";
    string constant TRANSACTION_EXPIRED = "Transaction expired";
    string constant INVALID_TRANSACTION_STATUS = "Invalid transaction status";
    string constant INVALID_DEADLINE = "Invalid deadline";
    string constant INVALID_FEE = "Invalid fee";
    string constant INSUFFICIENT_FEE = "Insufficient fee";
    string constant INVALID_TRANSACTION_ID = "Invalid transaction ID";
    string constant INVALID_BTC_TX = "Invalid BTC transaction";
    string constant CANNOT_COMPLETE_TRANSACTION = "Cannot complete transaction";
    string constant SUBMITTED_SIGNATURES_OUTTIME = "Out submitted signatures time";

    // Arbitrator related errors
    string constant ARBITRATOR_ALREADY_REGISTERED = "Arbitrator already registered";
    string constant ARBITRATOR_NOT_REGISTERED = "Arbitrator not registered";
    string constant ARBITRATOR_NOT_ACTIVE = "Arbitrator not active";
    string constant ARBITRATOR_ALREADY_WORKING = "Arbitrator already working";
    string constant ARBITRATOR_NOT_WORKING = "Arbitrator not working";
    string constant INVALID_ARBITRATOR_STATUS = "Invalid arbitrator status";
    string constant INVALID_STAKE_AMOUNT = "Invalid stake amount";
    string constant INVALID_FEE_RATE = "Invalid fee rate";
    string constant STAKE_STILL_LOCKED = "Stake still locked";
    string constant INSUFFICIENT_STAKE = "Insufficient stake";
    string constant STAKE_EXCEEDS_MAX = "Stake exceeds maximum";
    string constant INVALID_TOKEN = "Invalid token";
    string constant INVALID_TOKEN_ID = "Invalid token ID";
    string constant TRANSFER_FAILED = "Transfer failed";
    string constant IS_FROZEN = "Is frozen";
    string constant INVALID_OPERATOR = "Invalid operator";
    string constant INVALID_REVENUE_ADDRESS = "Invalid revenue address";

    // Config related errors
    string constant INVALID_CONFIG_KEY = "Invalid config key";
    string constant INVALID_CONFIG_VALUE = "Invalid config value";
    string constant CONFIG_NOT_FOUND = "Config not found";

    // Operator related errors
    string constant OPERATOR_ALREADY_REGISTERED = "Operator already registered";
    string constant OPERATOR_NOT_REGISTERED = "Operator not registered";
    string constant OPERATOR_NOT_AUTHORIZED = "Operator not authorized";
    string constant NOT_COMPENSATION_MANAGER = "Not compensation manager";

    // Compensation related errors
    string constant EMPTY_RAW_DATA = "Empty raw data";
    string constant EMPTY_PUBLIC_KEY = "Empty public key";
    string constant EMPTY_HASH = "Empty hash";
    string constant EMPTY_SIGNATURE = "Empty signature";
    string constant EMPTY_OPERATOR_PUBLIC_KEY = "Empty operator public key";
    string constant INVALID_ZK_PROOF = "Invalid zero-knowledge proof";
    string constant TRANSACTION_EXISTS = "Transaction exists";
    string constant PUBLIC_KEY_MISMATCH = "Public key mismatch";
    string constant BTC_TRANSACTION_MISMATCH = "BTC transaction mismatch";
    string constant NO_STAKE_AVAILABLE = "No stake available";
    string constant NOT_TRANSACTION_OWNER = "Not transaction owner";
    string constant NOT_TRANSACTION_ARBITRATOR = "Not transaction arbitrator";
    string constant TRANSACTION_COMPLETED = "Transaction completed";
    string constant DEADLINE_NOT_REACHED = "Deadline not reached";
    string constant SIGNATURE_ALREADY_SUBMITTED = "Signature already submitted";
    string constant SIGNATURE_NOT_SUBMITTED = "Signature not submitted";
    string constant SIGNATURE_MISMATCH = "Signature mismatch";
    string constant STILL_IN_FROZEN_PERIOD = "Still in frozen period";
    string constant NO_FEE_AVAILABLE = "No fee available";
    string constant COMPENSATION_WITHDRAWN = "Compensation withdrawn";
    string constant NO_COMPENSATION_AVAILABLE = "No compensation available";
    string constant INSUFFICIENT_SYSTEM_FEE = "Insufficient system fee";
    string constant TRANSACTION_NOT_COMPLETED = "Transaction not completed";
    string constant EMPTY_TOKEN_IDS = "Empty token IDs";
    string constant INVALID_NFT_CONTRACT = "Invalid NFT contract";
    string constant CANNOT_CLAIM_ARBITRATOR_FEE = "cannot claim arbitrator fee";
}