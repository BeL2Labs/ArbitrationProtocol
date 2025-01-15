import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useContractCall } from '@/services/evm/hooks/useContractCall';
import { tokenToReadableValue } from '@/services/tokens/tokens';
import BigNumber from 'bignumber.js';
import { useCallback } from 'react';
import { abi } from "../../../../../contracts/core/CompensationManager.sol/CompensationManager.json";

export const useWithdrawCompensationFee = () => {
  const activeChain = useActiveEVMChainConfig();
  const { readContract, isPending, isSuccess, error } = useContractCall();

  const getWithdrawCompensationFee = useCallback(async (compensationId: string): Promise<BigNumber> => {
    const rawFee = await readContract({
      contractAddress: activeChain?.contracts.compensationManager,
      abi,
      functionName: 'getWithdrawCompensationFee',
      args: [compensationId]
    });

    console.log("Get withdraw compensation fee result:", rawFee)

    if (!rawFee)
      return undefined;

    return tokenToReadableValue(rawFee, 18);
  }, [activeChain, readContract]);

  return {
    getWithdrawCompensationFee,
    isPending, isSuccess, error
  };
};
