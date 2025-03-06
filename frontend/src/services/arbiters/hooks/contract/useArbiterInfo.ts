import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useContractCall } from '@/services/evm/hooks/useContractCall';
import { useCallback } from 'react';
import { abi } from "../../../../../contracts/core/ArbitratorManager.sol/ArbitratorManager.json";
import { ContractArbiterInfo } from '../../dto/contract-arbiter-info';
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

  const fetchArbiterInfo = useCallback(async (): Promise<ArbiterInfo> => {
    const contractArbiterInfo: ContractArbiterInfo = await readContract({
      contractAddress: activeChain.contracts.arbitratorManager,
      abi,
      functionName: 'getArbitratorInfo',
      args: [arbiterAddress]
    });

    if (!contractArbiterInfo)
      return undefined;

    const nftValue = await fetchArbiterNFTStakeValue(arbiterAddress);

    const arbiter = ArbiterInfo.fromContractArbiterInfo(contractArbiterInfo);
    if (arbiter) {
      arbiter.setNFTValue(nftValue);
      arbiter.isActive = await fetchArbiterIsActive(arbiterAddress);
      const stakes = await fetchMultiArbiterStakeValue([arbiter.id]);
      arbiter.totalValue = stakes?.[0];
    }

    console.log("Fetched arbiter info:", arbiter);

    return arbiter;
  }, [readContract, activeChain, arbiterAddress, fetchArbiterNFTStakeValue, fetchMultiArbiterStakeValue, fetchArbiterIsActive]);

  return { fetchArbiterInfo };
};
