
export type ContractArbiterInfo = {
  arbitrator: string;
  paused: boolean;
  activeTransactionId: string;
  currentFeeRate: bigint; // Fee rate in NATIVE (need to call another method to get currentBTCFeeRate)
  deadLine: bigint;
  erc20Token: string;
  ethAmount: bigint;
  lastSubmittedWorkTime: bigint;
  nftContract: string;
  nftTokenIds: string[];
  operator: string;
  operatorBtcAddress: string;
  operatorBtcPubKey: string;
  revenueBtcAddress: string;
  revenueBtcPubKey: string;
  revenueETHAddress: string;
  status: number;
}

export type ContractArbiterInfoExt = {
  currentBTCFeeRate: bigint;
}