import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useContractCall } from '@/services/evm/hooks/useContractCall';
import { useCallback } from 'react';
import { decodeFunctionResult, encodeFunctionData } from 'viem';
import multicallAbi from "../../../../../contracts/Multicall3.json";

/**
 * NOTE: wrote custom multicall because wagmi's multicall creates weird typescript error
 * "Type instantiation is excessively deep and possibly infinite.ts(2589)".
 */
export const useMulticall = () => {
  const activeChain = useActiveEVMChainConfig();
  const { readContract } = useContractCall();

  const singleContractMulticall = useCallback(async <ReturnType>(abi: any, contractAddress: string, functionName: string, multiArgs: any[][]): Promise<ReturnType[]> => {
    const input = multiArgs.map(args => ({
      target: contractAddress,
      allowFailure: true,
      callData: encodeFunctionData({ abi, functionName, args })
    }));

    const callResult: { success: boolean, returnData: any }[] = await readContract({
      contractAddress: activeChain.contracts.multicall3,
      abi: multicallAbi,
      functionName: 'aggregate3',
      args: [input]
    });

    if (!callResult)
      return undefined;

    const decodedResults = callResult.map(callResult => decodeFunctionResult({
      abi, data: callResult.returnData, functionName
    })) as ReturnType[];

    return decodedResults;
  }, [readContract, activeChain]);

  return { singleContractMulticall };
};
