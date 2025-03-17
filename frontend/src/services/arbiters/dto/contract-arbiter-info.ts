
export type ContractArbiterInfo = {
  arbitrator: string;
  paused: boolean;
  activeTransactionId: string;
  currentFeeRate: bigint;
  deadLine: bigint;
  erc20Token: string;
  ethAmount: bigint;
  lastSubmittedWorkTime: bigint;
  nftContract: string;
  nftTokenIds: string[];
  operator: string;
  operatorBtcAddress: string;
  operatorBtcPubKey: string;
  pendingFeeRate: bigint;
  revenueBtcAddress: string;
  revenueBtcPubKey: string;
  revenueETHAddress: string;
  status: number;
}

export type ContractArbiterInfoExt = {
  currentBTCFeeRate: bigint;
}