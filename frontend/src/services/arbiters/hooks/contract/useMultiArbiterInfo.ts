import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useMulticall } from '@/services/multicall/hooks/contract/useMulticall';
import { useCallback } from 'react';
import { abi } from "../../../../../contracts/core/ArbitratorManager.sol/ArbitratorManager.json";
import { ContractArbiterInfo, ContractArbiterInfoExt } from '../../dto/contract-arbiter-info';
import { ArbiterInfo } from '../../model/arbiter-info';

/**
 * Multicall request to get multiple arbiter at once (subgraph state is hard to keep in sync with contract...)
 */
export const useMultiArbiterInfo = () => {
  const activeChain = useActiveEVMChainConfig();
  const { singleContractMulticall } = useMulticall();

  const fetchMultiArbiterInfo = useCallback(async (arbiterIds: string[]): Promise<ArbiterInfo[]> => {
    const multiCallParams = arbiterIds.flatMap(arbiterId => ([
      { functionName: "getArbitratorInfo", multiArgs: [arbiterId] },
      { functionName: "getArbitratorInfoExt", multiArgs: [arbiterId] }
    ]));

    const dualContractArbiters = await singleContractMulticall<ContractArbiterInfo | ContractArbiterInfoExt>(
      abi,
      activeChain!.contracts.arbitratorManager,
      multiCallParams
    );

    if (!dualContractArbiters)
      return undefined;

    // Multicall results for the same arbiter (2 methods) are every 2 elements. We sotr this out.
    const contractArbiterInfo = dualContractArbiters.filter((_, i) => i % 2 === 0) as ContractArbiterInfo[];
    const contractArbiterInfoExt = dualContractArbiters.filter((_, i) => i % 2 === 1) as ContractArbiterInfoExt[];

    return contractArbiterInfo.map((contractArbiterInfo, i) => ArbiterInfo.fromContractArbiterInfo(contractArbiterInfo, contractArbiterInfoExt[i]));
  }, [activeChain, singleContractMulticall]);

  return { fetchMultiArbiterInfo };
};
