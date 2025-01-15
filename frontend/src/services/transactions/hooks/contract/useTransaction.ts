import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useContractCall } from '@/services/evm/hooks/useContractCall';
import { useCallback } from 'react';
import { abi } from "../../../../../contracts/core/TransactionManager.sol/TransactionManager.json";
import { ContractTransaction } from '../../dto/contract-transaction';
import { Transaction } from '../../model/transaction';

/**
 * Retrieves a transaction from the contract instead of subgraph.
 * Used when we need missing information that the subgraph doesn't have such as the list of utxos.
 */
export const useTransaction = (transactionId: string) => {
  const activeChain = useActiveEVMChainConfig();
  const { readContract } = useContractCall();

  const fetchTransaction = useCallback(async (): Promise<Transaction> => {
    const contractTransaction: ContractTransaction = await readContract({
      contractAddress: activeChain.contracts.transactionManager,
      abi,
      functionName: 'getTransactionById',
      args: [transactionId]
    });

    if (!contractTransaction)
      return undefined;

    const transaction = Transaction.fromContractTransaction(contractTransaction, transactionId);

    console.log("Fetched transaction from contract:", transaction);

    return transaction;
  }, [readContract, activeChain, transactionId]);

  return { fetchTransaction };
};
