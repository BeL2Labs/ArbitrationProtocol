import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useMulticall } from '@/services/multicall/hooks/contract/useMulticall';
import { useCallback } from 'react';
import { abi } from "../../../../../contracts/core/ArbitratorManager.sol/ArbitratorManager.json";
import { ContractArbiterInfo } from '../../dto/contract-arbiter-info';
import { ArbiterInfo } from '../../model/arbiter-info';

/**
 * Multicall request to get multiple arbiter at once (subgraph state is hard to keep in sync with contract...)
 */
export const useMultiArbiterInfo = () => {
  const activeChain = useActiveEVMChainConfig();
  const { singleContractMulticall } = useMulticall();

  const fetchMultiArbiterInfo = useCallback(async (arbiterIds: string[]): Promise<ArbiterInfo[]> => {
    const contractArbiters = await singleContractMulticall<ContractArbiterInfo>(
      abi,
      activeChain!.contracts.arbitratorManager,
      "getArbitratorInfo",
      arbiterIds.map(arbiterId => [arbiterId])
    );

    if (!contractArbiters)
      return undefined;

    return contractArbiters.map((contractArbiter, i) => ArbiterInfo.fromContractArbiterInfo(contractArbiter));
  }, [activeChain, singleContractMulticall]);

  return { fetchMultiArbiterInfo };
};
