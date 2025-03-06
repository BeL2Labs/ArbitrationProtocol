export type UTXO = {
  txHash: string;   // Transaction hash
  index: number;     // Output index
  script: string;     // Locking Script
  amount: string;   // Amount in satoshis
}

// export type ContractTransaction = {
//   dapp: string;
//   arbitrator: string;
//   startTime: string;
//   deadline: string;
//   btcTxHash: string;         // Hash of the Bitcoin transaction with empty input scripts
//   status: number;
//   depositedFee: string;
//   signature: string;           // Arbitrator's signature
//   compensationReceiver: string;           // Compensation receiver address
//   timeoutCompensationReceiver: string;    // Timeout compensation receiver address
//   utxos: UTXO[];                         // Array of UTXOs associated with the transaction
//   script: string;                         // Bitcoin transaction script
//   requestArbitrationTime: string;
// }

export type ContractTransactionData = {
  startTime: string;
  deadline: string;
  requestArbitrationTime: string;
  depositedFee: string;
  status: number;
}

export type ContractTransactionParties = {
  dapp: string;
  arbitrator: string;
  compensationReceiver: string;
  timeoutCompensationReceiver: string;
  refundAddress: string;
  depositedFeeRefundAddress: string;
}