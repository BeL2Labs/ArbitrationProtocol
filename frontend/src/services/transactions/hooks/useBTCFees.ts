import { UTXO } from "@/services/nownodes-api/model/types";
import { Transaction } from "@/services/transactions/model/transaction";
import { useBehaviorSubject } from "@/utils/useBehaviorSubject";
import BigNumber from "bignumber.js";
import { useCallback, useEffect, useState } from "react";
import { checkOnChainTransactionBTCFeesWithdrawn, withdrawnBTCFees$ } from "../transaction-btc-fees.service";

export type TransactionBTCFeeInfo = {
  arbiterFeeBTC: BigNumber;
  withdrawableAmountBTC: BigNumber;
  utxo?: UTXO;
}

/**
 * Given a list of transactions, checks which ones still have a pending btc fee balance that the arbiter
 * can withwdraw. Withdrawing btc fees can be done in one transaction for multiple fees.
 */
export const useBTCFees = (transactions: Transaction[]) => {
  const [info, setInfo] = useState<Record<string, TransactionBTCFeeInfo>>(undefined);
  const withdrawnBTCFees = useBehaviorSubject(withdrawnBTCFees$);

  const areTransactionBTCFeesWithdrawn = useCallback((transactionId: string) => {
    return withdrawnBTCFees.includes(transactionId);
  }, [withdrawnBTCFees]);

  const computeFees = useCallback(async () => {
    if (!transactions) {
      setInfo(undefined);
      return;
    }

    const feeInfo: Record<string, TransactionBTCFeeInfo> = {};
    for (const tx of transactions) {
      let arbiterFeeBTC: BigNumber = undefined;
      let withdrawableAmountBTC: BigNumber = undefined; // Undefined means there is not even a BTC fee (should be native)
      let utxo: UTXO;
      if (tx.arbitratorFeeBTC?.gt(0)) {
        arbiterFeeBTC = tx.arbitratorFeeBTC;

        // If we know in local storage we already paid, that's a 0.
        if (areTransactionBTCFeesWithdrawn(tx.id))
          withdrawableAmountBTC = new BigNumber(0);
        else {
          const btcFeeAddressCheckOutput = await checkOnChainTransactionBTCFeesWithdrawn(tx);
          if (btcFeeAddressCheckOutput) {
            withdrawableAmountBTC = btcFeeAddressCheckOutput.withdrawn ? new BigNumber(0) : arbiterFeeBTC;
            utxo = btcFeeAddressCheckOutput.utxo;
          }
          else {
            withdrawableAmountBTC = new BigNumber(0);
          }
        }
      }

      feeInfo[tx.id] = { arbiterFeeBTC, withdrawableAmountBTC, utxo };
    }

    setInfo(feeInfo);
  }, [transactions, areTransactionBTCFeesWithdrawn]);

  useEffect(() => {
    void computeFees();
  }, [computeFees]);

  return info;
}