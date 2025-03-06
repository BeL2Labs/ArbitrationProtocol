export type ConfigManagerSettings = {
  minStake: bigint; // readable number of native coins
  maxStake: bigint; // readable number of native coins
  minStakeLockedTime: bigint;
  minTransactionDuration: bigint;
  maxTransactionDuration: bigint;
  transactionMinFeeRate: bigint;
  arbitrationTimeout: bigint;
  arbitrationFrozenPeriod: bigint;
  systemFeeRate: bigint;
  systemCompensationFeeRate: bigint;
  systemFeeCollector: bigint;
  arbitrationBtcFeeRate: bigint;
}