import { getUTXOs } from "../nownodes-api/nownodes-api";

const TransactionBTCFeesStorageKey = 'TransactionBTCFees';

type WithdrawnBTCFees = string[]; // list of arbiter transaction ids for which the arbiter has withdrawn the fees.

export function checkTransactionBTCFeesWithdrawn(transactionId: string) {
  const withdrawnBTCFees = getWithdrawnBTCFees();
  return withdrawnBTCFees.includes(transactionId);
}

export function markTransactionBTCFeesWithdrawn(transactionId: string) {
  const withdrawnBTCFees = getWithdrawnBTCFees();
  withdrawnBTCFees.push(transactionId);
  localStorage.setItem(TransactionBTCFeesStorageKey, JSON.stringify(withdrawnBTCFees));
}

function getWithdrawnBTCFees() {
  return JSON.parse(localStorage.getItem(TransactionBTCFeesStorageKey) || '[]') as WithdrawnBTCFees;
}

/**
 * Checks if there are BTC fees to withdraw. We know this by checking the unique BTC fees address UTXOs.
 * If there is no UTXO, this means fees have been withdrawn. Otherwise, this means the arbiter can still
 * claims those fees.
 */
export async function checkOnChainTransactionBTCFeesWithdrawn(transactionId: string): Promise<boolean> {
  const transactionBtcFeesAddress = "TODO";
  const utxoResult = await getUTXOs(transactionBtcFeesAddress);
  console.log("utxoResult", utxoResult);

  return true; // TODO
}