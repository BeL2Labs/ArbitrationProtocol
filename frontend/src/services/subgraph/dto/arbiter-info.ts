
export interface ArbiterInfo {
  id: string;
  address: string; // same as id
  ethAmount: string;
  createdAt: number; // timestamp seconds
  deadline: number;
  ethFeeRate: number;
  btcFeeRate: number;
  paused: boolean;
  activeTransactionId: string;

  // Operator
  operatorEvmAddress: string;
  operatorBtcAddress: string;
  operatorBtcPubKey: string;

  // Revenue
  revenueEvmAddress: string;
  revenueBtcAddress: string;
  revenueBtcPubKey: string;

  // Computed
  isActive: boolean;
}
