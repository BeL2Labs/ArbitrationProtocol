export type ContractArbiterBasicInfo = {
  arbitrator: string; // Arbitrator's Ethereum address
  paused: boolean; // Whether the arbitrator is paused
  deadLine: bigint; // Validity period deadline
  registerTime: bigint; // Registration timestamp

  // ??? status: number;
};

export type ContractArbiterOperationInfo = {
  operator: string;
  operatorBtcAddress: string;
  operatorBtcPubKey: string;
  activeTransactionId: string;
  lastSubmittedWorkTime: bigint;
};

export type ContractArbiterRevenueInfo = {
  currentFeeRate: bigint; // Fee rate in NATIVE (need to call another method to get currentBTCFeeRate)
  currentBTCFeeRate: bigint;
  revenueBtcAddress: string;
  revenueBtcPubKey: string;
  revenueETHAddress: string;
};

export type ContractArbiterAssets = {
  ethAmount: bigint;
  erc20Token: string;
  erc20Amount: bigint;
  nftContract: string;
  nftTokenIds: string[];
};
