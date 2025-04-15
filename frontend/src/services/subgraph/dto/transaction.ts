export interface Transaction {
  id: string;
  dapp: string;
  arbiter: string;
  startTime: number;
  deadline: number;
  status: string;
  depositedFee: string;
  compensationReceiver: string;
  timeoutCompensationReceiver: string;
  requestArbitrationTime: number;
  btcFeeAddress: string;
}