import { useActiveEVMChainConfig } from "@/services/chains/hooks/useActiveEVMChainConfig";
import { useCallback, useEffect, useState } from "react";
import { Transaction } from "../model/transaction";
import { fetchTransactions as fetchSubgraphTransactions } from "../transactions.service";
import { useMultiTransactionStatus } from "./contract/useMultiTransactionStatus";
import { useMultiTransactions } from "./contract/useMultiTransactions";

/**
 * @param arbiter if passed, only transactions from this arbiters are fetched
 */
export const useTransactions = (currentPage: number, resultsPerPage: number, arbiter?: string, search?: string) => {
  const activeChain = useActiveEVMChainConfig();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { fetchTransactionStatuses } = useMultiTransactionStatus();
  const { fetchTransactions } = useMultiTransactions();
  const [total, setTotal] = useState(undefined);

  const refreshTransactions = useCallback(async () => {
    setTransactions(undefined);
    if (activeChain) {
      const { transactions: subgraphTransactions, total: _total } = (await fetchSubgraphTransactions(activeChain, (currentPage - 1) * resultsPerPage, resultsPerPage, { arbiter, search })) || {};
      setTotal(_total);

      const contractTransactions = await fetchTransactions(subgraphTransactions?.map(t => t.id));

      if (contractTransactions) {
        const statuses = await fetchTransactionStatuses(contractTransactions?.map(tx => tx.id));
        // Update dynamic status of each transaction with latest dynamic contract value (not stored)
        for (const tx of contractTransactions) {
          tx.dynamicStatus = statuses?.find(s => s.id === tx.id)?.status || "Unknown";
        }

        // Update dynamic fees - because this is only known by the subgraph. So we update results from chain, 
        // with subgraph data.
        contractTransactions.forEach((tx, i) => {
          tx.createdBy = subgraphTransactions[i].createdBy;
          tx.btcFeeAddress = subgraphTransactions[i].btcFeeAddress;
          tx.arbitratorFeeNative = subgraphTransactions[i].arbitratorFeeNative;
          tx.arbitratorFeeBTC = subgraphTransactions[i].arbitratorFeeBTC;
          tx.refundedFee = subgraphTransactions[i].refundedFee;
          tx.systemFee = subgraphTransactions[i].systemFee;
        });
      }

      console.log("Using transactions:", contractTransactions);

      setTransactions(contractTransactions);
    }
  }, [activeChain, currentPage, resultsPerPage, arbiter, search, fetchTransactions, fetchTransactionStatuses]);

  useEffect(() => {
    void refreshTransactions();
  }, [refreshTransactions]);

  return { transactions, refreshTransactions, total }
}