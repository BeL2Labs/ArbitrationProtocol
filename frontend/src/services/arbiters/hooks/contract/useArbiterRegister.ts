import { useWalletContext } from '@/contexts/WalletContext/WalletContext';
import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useContractCall } from '@/services/evm/hooks/useContractCall';
import BigNumber from 'bignumber.js';
import { useCallback } from 'react';
import { parseEther } from 'viem';
import { abi } from "../../../../../contracts/core/ArbitratorManager.sol/ArbitratorManager.json";

export const useArbiterRegister = () => {
  const { evmAccount } = useWalletContext();
  const activeChain = useActiveEVMChainConfig();
  const { writeContract, isPending, isSuccess, error } = useContractCall();

  /**
   * Registers by staking native coin
   * @param stakeAmount human readable amount of native coins
   */
  const registerArbiterByStakeETH = useCallback(async (
    stakeAmount: BigNumber,
    btcAddress: string,
    btcPubKey: string,
    feeRate: number,
    btcFeeRate: number,
    deadline: number
  ): Promise<boolean> => {
    const { hash, receipt } = await writeContract({
      contractAddress: activeChain?.contracts.arbitratorManager,
      abi,
      functionName: 'registerArbitratorByStakeETH',
      args: [
        btcAddress,
        `0x${btcPubKey}`,
        feeRate * 100, // 1% must be encoded as 100
        btcFeeRate * 100, // 1% must be encoded as 100
        deadline
      ],
      value: parseEther(stakeAmount.toString())
    });

    console.log("Register arbiter by staking ETH result:", hash, receipt)
    return !!receipt;
  }, [activeChain, writeContract]);

  /**
   * Registers by staking BPos NFTs
   */
  const registerArbiterByStakeNFT = useCallback(async (
    tokenIds: string[],
    btcAddress: string,
    btcPubKey: string,
    feeRate: number,
    btcFeeRate: number,
    deadline: number
  ): Promise<boolean> => {
    const { hash, receipt } = await writeContract({
      contractAddress: activeChain?.contracts.arbitratorManager,
      abi,
      functionName: 'registerArbitratorByStakeNFT',
      args: [
        tokenIds,
        btcAddress,
        `0x${btcPubKey}`,
        feeRate * 100, // 1% must be encoded as 100
        btcFeeRate * 100, // 1% must be encoded as 100
        deadline
      ]
    });

    console.log("Register arbiter by staking NFT result:", hash, receipt)
    return !!receipt;
  }, [activeChain, writeContract]);

  return {
    registerArbiterByStakeETH,
    registerArbiterByStakeNFT,
    isPending,
    isSuccess,
    error
  };
};
