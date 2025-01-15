import { useActiveEVMChainConfig } from "@/services/chains/hooks/useActiveEVMChainConfig";
import { useCallback, useEffect, useState } from "react";
import { Transaction } from "../model/transaction";
import { fetchTransactions as fetchSubgraphTransactions } from "../transactions.service";
import { useMultiTransactionStatus } from "./contract/useMultiTransactionStatus";
import { useMultiTransactions } from "./contract/useMultiTransactions";

export const useTransactions = () => {
  const activeChain = useActiveEVMChainConfig();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { fetchTransactionStatuses } = useMultiTransactionStatus();
  const { fetchTransactions } = useMultiTransactions();

  const refreshTransactions = useCallback(async () => {
    setTransactions(undefined);
    if (activeChain) {
      const { transactions: subgraphTransactions } = (await fetchSubgraphTransactions(activeChain, 0, 100)) || {};
      const contractTransactions = await fetchTransactions(subgraphTransactions?.map(t => t.id));

      if (contractTransactions) {
        const statuses = await fetchTransactionStatuses(contractTransactions?.map(tx => tx.id));
        // Update dynamic status of each transaction with latest dynamic contract value (not stored)
        for (const tx of contractTransactions) {
          tx.dynamicStatus = statuses?.find(s => s.id === tx.id)?.status || "Unknown";
        }
      }

      console.log("Using transactions:", contractTransactions);

      setTransactions(contractTransactions);
    }
  }, [activeChain, fetchTransactions, fetchTransactionStatuses]);

  useEffect(() => {
    void refreshTransactions();
  }, [refreshTransactions]);

  return { transactions, refreshTransactions }
}