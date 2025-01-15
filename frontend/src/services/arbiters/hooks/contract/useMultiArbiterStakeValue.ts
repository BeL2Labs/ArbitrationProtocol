import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useMulticall } from '@/services/multicall/hooks/contract/useMulticall';
import { tokenToReadableValue } from '@/services/tokens/tokens';
import BigNumber from 'bignumber.js';
import { useCallback } from 'react';
import { abi } from "../../../../../contracts/core/ArbitratorManager.sol/ArbitratorManager.json";

/**
 * Multicall request to get multiple arbiter stake value at once (not permanent data in contract because of nfrs)
 */
export const useMultiArbiterStakeValue = () => {
  const activeChain = useActiveEVMChainConfig();
  const { singleContractMulticall } = useMulticall();

  const fetchMultiArbiterStakeValue = useCallback(async (arbiterIds: string[]): Promise<BigNumber[]> => {
    const stakes = await singleContractMulticall<BigNumber>(
      abi,
      activeChain!.contracts.arbitratorManager,
      "getAvailableStake",
      arbiterIds.map(arbiterId => [arbiterId])
    );

    return stakes.map(stake => tokenToReadableValue(stake, 18));
  }, [activeChain, singleContractMulticall]);

  return { fetchMultiArbiterStakeValue };
};
