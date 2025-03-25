import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useMulticall } from '@/services/multicall/hooks/contract/useMulticall';
import { useCallback } from 'react';
import { abi } from "../../../../../contracts/core/TransactionManager.sol/TransactionManager.json";
import { ContractTransactionData, ContractTransactionParties } from '../../dto/contract-transaction';
import { Transaction } from '../../model/transaction';

/**
 * Multicall request to get multiple transactions at once
 */
export const useMultiTransactions = () => {
  const activeChain = useActiveEVMChainConfig();
  const { singleContractMulticall } = useMulticall();

  const fetchTransactions = useCallback(async (transactionIds: string[]): Promise<Transaction[]> => {
    const [data, parties, signHashes] = await Promise.all([
      singleContractMulticall<ContractTransactionData>(
        abi, activeChain!.contracts.transactionManager, transactionIds.map(id => ({ functionName: "getTransactionDataById", multiArgs: [id] }))
      ),
      singleContractMulticall<ContractTransactionParties>(
        abi, activeChain!.contracts.transactionManager, transactionIds.map(id => ({ functionName: "getTransactionPartiesById", multiArgs: [id] }))
      ),
      singleContractMulticall<string>(
        abi, activeChain!.contracts.transactionManager, transactionIds.map(id => ({ functionName: "getTransactionSignHashById", multiArgs: [id] }))
      )
    ])

    if (!data || !parties || !signHashes)
      return undefined;

    return transactionIds
      .map((transactionId, i) => Transaction.fromContractTransaction(data[i], parties[i], signHashes[i], transactionId))
      .filter(t => !!t);
  }, [activeChain, singleContractMulticall]);

  return { fetchTransactions };
};
