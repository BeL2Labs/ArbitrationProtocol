export interface Transaction {
  id: string;
  txId: string;
  dapp: string;
  arbiter: string;
  startTime: number;
  deadline: number;
  status: string;
  depositedFee: string;
  signature: string;
  compensationReceiver: string;
  timeoutCompensationReceiver: string;
  script: string; // Bitcoin transaction script
  requestArbitrationTime: number;
}