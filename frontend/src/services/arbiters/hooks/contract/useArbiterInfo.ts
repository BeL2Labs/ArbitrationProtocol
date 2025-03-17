import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useContractCall } from '@/services/evm/hooks/useContractCall';
import { useMulticall } from '@/services/multicall/hooks/contract/useMulticall';
import { useCallback } from 'react';
import { abi } from "../../../../../contracts/core/ArbitratorManager.sol/ArbitratorManager.json";
import { ContractArbiterInfo, ContractArbiterInfoExt } from '../../dto/contract-arbiter-info';
import { ArbiterInfo } from '../../model/arbiter-info';
import { useArbiterIsActive } from './useArbiterIsActive';
import { useArbiterNFTStakeValue } from './useArbiterNFTStakeValue';
import { useMultiArbiterStakeValue } from './useMultiArbiterStakeValue';

/**
 * Retrieves an arbiter from the contract instead of subgraph.
 * Used when we need latest information such as when editing an owned arbiter, as subgraph
 * sometimes has stale information.
 */
export const useArbiterInfo = (arbiterAddress: string) => {
  const activeChain = useActiveEVMChainConfig();
  const { readContract } = useContractCall();
  const { fetchArbiterNFTStakeValue } = useArbiterNFTStakeValue();
  const { fetchArbiterIsActive } = useArbiterIsActive();
  const { fetchMultiArbiterStakeValue } = useMultiArbiterStakeValue();
  const { singleContractMulticall } = useMulticall();

  const fetchArbiterInfo = useCallback(async (): Promise<ArbiterInfo> => {
    const multiCallParams = [
      { functionName: "getArbitratorInfo", multiArgs: [arbiterAddress] },
      { functionName: "getArbitratorInfoExt", multiArgs: [arbiterAddress] }
    ];
    const dualContractArbiter = await singleContractMulticall<ContractArbiterInfo | ContractArbiterInfoExt>(
      abi,
      activeChain!.contracts.arbitratorManager,
      multiCallParams
    );

    if (!dualContractArbiter)
      return undefined;

    const nftValue = await fetchArbiterNFTStakeValue(arbiterAddress);

    const arbiter = ArbiterInfo.fromContractArbiterInfo(
      dualContractArbiter[0] as ContractArbiterInfo,
      dualContractArbiter[1] as ContractArbiterInfoExt
    );

    if (arbiter) {
      arbiter.setNFTValue(nftValue);
      arbiter.isActive = await fetchArbiterIsActive(arbiterAddress);
      const stakes = await fetchMultiArbiterStakeValue([arbiter.id]);
      arbiter.totalValue = stakes?.[0];
    }

    console.log("Fetched arbiter info:", arbiter);

    return arbiter;
  }, [arbiterAddress, singleContractMulticall, activeChain, fetchArbiterNFTStakeValue, fetchArbiterIsActive, fetchMultiArbiterStakeValue]);

  return { fetchArbiterInfo };
};
