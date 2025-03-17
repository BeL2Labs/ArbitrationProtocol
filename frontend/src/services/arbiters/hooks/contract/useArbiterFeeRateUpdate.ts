import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useContractCall } from '@/services/evm/hooks/useContractCall';
import { useCallback } from 'react';
import { abi } from "../../../../../contracts/core/ArbitratorManager.sol/ArbitratorManager.json";

export const useArbiterFeeRateUpdate = () => {
  const activeChain = useActiveEVMChainConfig();
  const { writeContract, isPending, isSuccess, error } = useContractCall();

  /**
   * Updates the fee rate in ELA and in BTC.
   * While both fee rates can be non 0 at the same time on the contract side, we force one or another
   * on the UI side for now.
   * 
   * @param feeRate Human readable, 1 for 1%
   */
  const setFeeRates = useCallback(async (elaFeeRate: number, btcFeeRate: number): Promise<boolean> => {
    console.log("Setting fee rates (human readable):", elaFeeRate, btcFeeRate);

    const { hash, receipt } = await writeContract({
      contractAddress: activeChain?.contracts.arbitratorManager,
      abi,
      functionName: 'setFeeRates',
      args: [
        Math.round(elaFeeRate * 100), // 1% must be encoded as 100
        Math.round(btcFeeRate * 100)
      ]
    });

    console.log("Update fee rate result:", hash, receipt)
    return !!receipt;
  }, [activeChain, writeContract]);

  return { setFeeRates, isPending, isSuccess, error };
};
