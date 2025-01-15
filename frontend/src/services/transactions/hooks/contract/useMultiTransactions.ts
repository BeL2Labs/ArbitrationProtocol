import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useMulticall } from '@/services/multicall/hooks/contract/useMulticall';
import { useCallback } from 'react';
import { abi } from "../../../../../contracts/core/TransactionManager.sol/TransactionManager.json";
import { ContractTransaction } from '../../dto/contract-transaction';
import { Transaction } from '../../model/transaction';

/**
 * Multicall request to get multiple transactions at once
 */
export const useMultiTransactions = () => {
  const activeChain = useActiveEVMChainConfig();
  const { singleContractMulticall } = useMulticall();

  const fetchTransactions = useCallback(async (transactionIds: string[]): Promise<Transaction[]> => {
    const contractTransactions = await singleContractMulticall<ContractTransaction>(
      abi,
      activeChain!.contracts.transactionManager,
      "getTransactionById",
      transactionIds.map(transactionId => [transactionId])
    );

    if (!contractTransactions)
      return undefined;

    return contractTransactions.map((ct, i) => Transaction.fromContractTransaction(ct, transactionIds[i])).filter(t => !!t);
  }, [activeChain, singleContractMulticall]);

  return { fetchTransactions };
};
