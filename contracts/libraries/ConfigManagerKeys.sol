// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library ConfigManagerKeys {
    bytes32 public constant MIN_STAKE = keccak256("MIN_STAKE");
    bytes32 public constant MAX_STAKE = keccak256("MAX_STAKE");
    bytes32 public constant MIN_STAKE_LOCKED_TIME = keccak256("MIN_STAKE_LOCKED_TIME");
    bytes32 public constant MIN_TRANSACTION_DURATION = keccak256("MIN_TRANSACTION_DURATION");
    bytes32 public constant MAX_TRANSACTION_DURATION = keccak256("MAX_TRANSACTION_DURATION");
    bytes32 public constant TRANSACTION_MIN_FEE_RATE = keccak256("TRANSACTION_MIN_FEE_RATE");
    bytes32 public constant ARBITRATION_TIMEOUT = keccak256("ARBITRATION_TIMEOUT");
    bytes32 public constant ARBITRATION_FROZEN_PERIOD = keccak256("arbitrationFrozenPeriod");
    bytes32 public constant SYSTEM_FEE_RATE = keccak256("systemFeeRate");
    bytes32 public constant SYSTEM_COMPENSATION_FEE_RATE = keccak256("SYSTEM_COMPENSATION_FEE_RATE");
    bytes32 public constant SYSTEM_FEE_COLLECTOR = keccak256("SYSTEM_FEE_COLLECTOR");
    bytes32 public constant ARBITRATION_BTC_FEE_RATE = keccak256("ARBITRATION_BTC_FEE_RATE");
}
