// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library Errors {
    // Common errors (Z0-Z9: Zero related, N0-N9: Not/No related, I0-I9: Invalid related)
    string constant ZERO_ADDRESS = "Z0";
    string constant NOT_AUTHORIZED = "N0";
    string constant INVALID_PARAMETER = "I0";
    string constant INSUFFICIENT_BALANCE = "B0";
    string constant NOT_TRANSACTION_MANAGER = "N1";
    string constant NOT_INITIALIZED = "N5";
    string constant ALREADY_INITIALIZED = "A0";
    string constant INVALID_DURATION = "I1";
    string constant LENGTH_MISMATCH = "L0";

    // DApp related errors (D0-D9)
    string constant DAPP_ALREADY_REGISTERED = "D0";
    string constant DAPP_NOT_REGISTERED = "D1";
    string constant DAPP_NOT_ACTIVE = "D2";

    // Transaction related errors (T0-T9, U0-U9)
    string constant TRANSACTION_NOT_FOUND = "T0";
    string constant INVALID_TRANSACTION_STATUS = "T2";
    string constant INVALID_DEADLINE = "T3";
    string constant INVALID_FEE = "T4";
    string constant INSUFFICIENT_FEE = "T5";
    string constant INVALID_TRANSACTION_ID = "T6";
    string constant INVALID_BTC_TX = "T7";
    string constant CANNOT_COMPLETE_TRANSACTION = "T8";
    string constant SUBMITTED_SIGNATURES_OUTTIME = "T9";
    string constant INVALID_UTXO = "U0";
    string constant INVALID_TRANSACTION = "U1";
    string constant UTXO_ALREADY_UPLOADED = "U2";
    string constant UTXO_NOT_UPLOADED = "U3";
    string constant UINT16_INSUFFICIENT_LENGHT = "U4";
    string constant UINT32_INSUFFICIENT_LENGHT = "U5";
    string constant UINT64_INSUFFICIENT_LENGHT = "U6";
    string constant REQUEST_ARBITRATION_OUTTIME = "U7";
    string constant INVALID_SIGN_DATA_TYPE = "U8";
    string constant INVALID_DER_SIGNATURE = "U9";
    string constant INVALID_INPUT_INDEX = "I2";
    string constant INVALID_OUTPUT_SCRIPT = "I3";
    string constant INVALID_OUTPUT_AMOUNT = "I5";
    string constant INVALID_MERKLE_PROOF = "I8";
    string constant NO_BTC_FEE = "B2";
    string constant TIMEOUT_NOT_REACHED = "T1";

    // Arbitrator related errors (A0-A9, S0-S9)
    string constant ARBITRATOR_ALREADY_REGISTERED = "A1";
    string constant ARBITRATOR_NOT_REGISTERED = "A2";
    string constant ARBITRATOR_NOT_ACTIVE = "A3";
    string constant ARBITRATOR_NOT_WORKING = "A5";
    string constant INVALID_FEE_RATE = "F0";
    string constant INVALID_BTC_FEE_RATE = "F2";
    string constant STAKE_STILL_LOCKED = "S1";
    string constant INSUFFICIENT_STAKE = "S2";
    string constant STAKE_EXCEEDS_MAX = "S3";
    string constant TRANSFER_FAILED = "F1";
    string constant INVALID_OPERATOR = "I4";
    string constant ARBITRATOR_FROZEN = "A6";
    string constant NO_RECEIVE_METHOD = "N6";
    string constant CONFIG_NOT_MODIFIABLE = "C0";
    string constant EMPTY_TOKEN_IDS = "E5";
    string constant INVALID_NFT_CONTRACT = "I6";

    string constant NOT_COMPENSATION_MANAGER = "N7";
    string constant TOKEN_NOT_WHITELISTED = "W0";
    string constant TOKEN_NOT_SUPPORTED = "W1";
    string constant ALREADY_PAUSED = "A7";
    string constant NOT_PAUSED = "A8";

    // Compensation related errors (M0-M9, E0-E9)
    string constant EMPTY_PUBLIC_KEY = "E1";
    string constant EMPTY_HASH = "E2";
    string constant EMPTY_SIGNATURE = "E3";
    string constant BTC_TRANSACTION_MISMATCH = "B1";
    string constant NO_STAKE_AVAILABLE = "N8";
    string constant NOT_TRANSACTION_ARBITRATOR = "M1";
    string constant TRANSACTION_NOT_IN_ARBITRATED = "M2";
    string constant DEADLINE_NOT_REACHED = "M3";
    string constant SIGNATURE_ALREADY_SUBMITTED = "S4";
    string constant SIGNATURE_NOT_SUBMITTED = "S5";
    string constant SIGNATURE_MISMATCH = "S6";
    string constant SIGNATURE_VERIFIED = "S7";
    string constant COMPENSATION_WITHDRAWN = "M4";
    string constant NO_COMPENSATION_AVAILABLE = "M5";
    string constant NO_ACTIVE_TRANSACTION = "M8";
    string constant INVALID_VERIFICATION_DATA = "I7";
    string constant COMPENSATION_ALREADY_CLAIMED = "M9";
    string constant ZK_PROOF_FAILED = "M6";
    string constant PUBLIC_KEY_MISMATCH = "M7";
}