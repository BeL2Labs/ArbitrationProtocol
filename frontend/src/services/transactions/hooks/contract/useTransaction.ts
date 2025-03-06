import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useContractCall } from '@/services/evm/hooks/useContractCall';
import { useCallback } from 'react';
import { abi } from "../../../../../contracts/core/TransactionManager.sol/TransactionManager.json";
import { Transaction } from '../../model/transaction';

/**
 * Retrieves a transaction from the contract instead of subgraph.
 * Used when we need missing information that the subgraph doesn't have such as the list of utxos.
 */
export const useTransaction = (transactionId: string) => {
  const activeChain = useActiveEVMChainConfig();
  const { readContract } = useContractCall();

  const fetchTransaction = useCallback(async (): Promise<Transaction> => {
    const [contractTransactionData, contractTransactionParties, contractTransactionSignHash] = await Promise.all([
      readContract({
        contractAddress: activeChain.contracts.transactionManager, abi,
        functionName: 'getTransactionDataById', args: [transactionId]
      }),
      readContract({
        contractAddress: activeChain.contracts.transactionManager, abi,
        functionName: 'getTransactionPartiesById', args: [transactionId]
      }),
      readContract({
        contractAddress: activeChain.contracts.transactionManager, abi,
        functionName: 'getTransactionSignHashById', args: [transactionId]
      })
    ]);

    if (!contractTransactionData || !contractTransactionParties || !contractTransactionSignHash)
      return undefined;

    const transaction = Transaction.fromContractTransaction(contractTransactionData, contractTransactionParties, contractTransactionSignHash, transactionId);

    console.log("Fetched transaction from contract:", transaction);

    return transaction;
  }, [readContract, activeChain, transactionId]);

  return { fetchTransaction };
};
