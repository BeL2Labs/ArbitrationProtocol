import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useContractCall } from '@/services/evm/hooks/useContractCall';
import BigNumber from 'bignumber.js';
import { useCallback } from 'react';
import { parseEther } from 'viem';
import { abi } from "../../../../../contracts/core/CompensationManager.sol/CompensationManager.json";

export const useWithdrawCompensation = () => {
  const activeChain = useActiveEVMChainConfig();
  const { writeContract, isPending, isSuccess, error } = useContractCall();

  /**
   * @param fee: withdraw fee, human readable
   */
  const withdrawCompensation = useCallback(async (compensationId: string, fee: BigNumber): Promise<boolean> => {
    const { hash, receipt } = await writeContract({
      contractAddress: activeChain?.contracts.compensationManager,
      abi,
      functionName: 'withdrawCompensation',
      args: [compensationId],
      value: parseEther(fee.toString())
    });

    console.log("Withdraw compensation result:", hash, receipt)
    return !!receipt;
  }, [activeChain, writeContract]);

  return {
    withdrawCompensation,
    isPending, isSuccess, error
  };
};
