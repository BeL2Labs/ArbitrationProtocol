import { Transaction } from "@/services/transactions/model/transaction";
import BigNumber from "bignumber.js";
import { useCallback, useEffect, useState } from "react";
import { checkOnChainTransactionBTCFeesWithdrawn, checkTransactionBTCFeesWithdrawn } from "../transaction-btc-fees.service";

export type TransactionBTCFeeInfo = {
  arbiterFeeBTC: BigNumber;
  withdrawableAmountBTC: BigNumber;
}

/**
 * Given a list of transactions, checks which ones still have a pending btc fee balance that the arbiter
 * can withwdraw. Withdrawing btc fees can be done in one transaction for multiple fees.
 */
export const useBTCFees = (transactions: Transaction[]) => {
  const [info, setInfo] = useState<Record<string, TransactionBTCFeeInfo>>(undefined);

  const computeFees = useCallback(async () => {
    if (!transactions) {
      setInfo(undefined);
      return;
    }

    const feeInfo: Record<string, TransactionBTCFeeInfo> = {};
    for (const tx of transactions) {
      let arbiterFeeBTC: BigNumber = undefined;
      let withdrawableAmountBTC: BigNumber = undefined; // Undefined means there is not even a BTC fee (should be native)
      if (tx.arbitratorFeeBTC?.gt(0)) {
        arbiterFeeBTC = tx.arbitratorFeeBTC;

        // If we know in local storage we already paid, that's a 0.
        if (checkTransactionBTCFeesWithdrawn(tx.id))
          withdrawableAmountBTC = new BigNumber(0);
        else {
          const hasUnclaimedFees = await checkOnChainTransactionBTCFeesWithdrawn(tx.id);
          withdrawableAmountBTC = hasUnclaimedFees ? arbiterFeeBTC : new BigNumber(0);
        }
      }

      feeInfo[tx.id] = { arbiterFeeBTC, withdrawableAmountBTC };
    }

    setInfo(feeInfo);
  }, [transactions]);

  useEffect(() => {
    void computeFees();
  }, [computeFees]);

  return info;
}