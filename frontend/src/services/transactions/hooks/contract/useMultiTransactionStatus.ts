import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useMulticall } from '@/services/multicall/hooks/contract/useMulticall';
import { useCallback } from 'react';
import { abi } from "../../../../../contracts/core/TransactionManager.sol/TransactionManager.json";
import { Transaction, TransactionStatus } from '../../model/transaction';

/**
 * Multicall request to get multiple transaction status at once (because not stored in contract data - dynamic)
 */
export const useMultiTransactionStatus = () => {
  const activeChain = useActiveEVMChainConfig();
  const { singleContractMulticall } = useMulticall();

  const fetchTransactionStatuses = useCallback(async (transactionIds: string[]): Promise<{ id: string, status: TransactionStatus }[]> => {
    const statuses = await singleContractMulticall<number>(
      abi,
      activeChain!.contracts.transactionManager,
      "getTransactionStatus",
      transactionIds.map(transactionId => [transactionId])
    );

    if (!statuses)
      return undefined;

    return statuses.map((status, i) => ({
      id: transactionIds[i],
      status: Transaction.fromContractStatus(status)
    }));
  }, [activeChain, singleContractMulticall]);

  return { fetchTransactionStatuses };
};
