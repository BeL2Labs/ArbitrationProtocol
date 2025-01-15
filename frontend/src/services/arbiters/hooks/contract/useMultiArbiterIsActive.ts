import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useMulticall } from '@/services/multicall/hooks/contract/useMulticall';
import { useCallback } from 'react';
import { abi } from "../../../../../contracts/core/ArbitratorManager.sol/ArbitratorManager.json";

/**
 * Multicall request to get multiple arbiter active status at once (not permanent data in contract)
 */
export const useMultiArbiterIsActive = () => {
  const activeChain = useActiveEVMChainConfig();
  const { singleContractMulticall } = useMulticall();

  const fetchMultiArbiterIsActive = useCallback(async (arbiterIds: string[]): Promise<boolean[]> => {
    const isActives = await singleContractMulticall<boolean>(
      abi,
      activeChain!.contracts.arbitratorManager,
      "isActiveArbitrator",
      arbiterIds.map(arbiterId => [arbiterId])
    );

    return isActives;
  }, [activeChain, singleContractMulticall]);

  return { fetchMultiArbiterIsActive };
};
