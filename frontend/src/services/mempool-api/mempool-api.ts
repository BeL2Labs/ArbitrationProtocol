import axios from "axios";

type FeeRates = {
  fastestFee: number; // 29,
  halfHourFee: number; // 27,
  hourFee: number; // 21,
  economyFee: number; // 4,
  minimumFee: number; // 2
};

/**
 * Fast and auth less API provided by mempool to get a reasonable estimation of
 * gas to pay for BTC transactions
 */
export const estimateBTCFeeRate = async (): Promise<number> => {
  const endpoint = "https://mempool.space/api/v1/fees/recommended";
  const response = await axios.get<FeeRates>(endpoint);
  const baseFee = response?.data.fastestFee || 0;

  // Increase fee provided by the api to increase our chances to get published soon.
  // Sometimes a bit too low just after a block.
  return Math.max(baseFee * 1.1, 2); // Min 2 sats/vb even in case of low network activity
}