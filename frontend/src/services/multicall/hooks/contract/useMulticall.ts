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

  const singleContractMulticall = useCallback(async <ReturnType>(abi: any, contractAddress: string, callParams: { functionName: string, multiArgs: any[] }[]): Promise<ReturnType[]> => {
    try {
      const input = callParams.map(({ functionName, multiArgs: args }) => {
        return {
          target: contractAddress,
          allowFailure: true,
          callData: encodeFunctionData({ abi, functionName, args })
        }
      });

      const callResult: { success: boolean, returnData: any }[] = await readContract({
        contractAddress: activeChain.contracts.multicall3,
        abi: multicallAbi,
        functionName: 'aggregate3',
        args: [input]
      });

      if (!callResult)
        return undefined;

      const decodedResults = callResult.map((callResult, i) => decodeFunctionResult({
        abi, data: callResult.returnData, functionName: callParams[i].functionName
      })) as ReturnType[];

      return decodedResults;
    }
    catch (e) {
      console.error("Error calling multicall:", e);
      return undefined;
    }
  }, [readContract, activeChain]);

  return { singleContractMulticall };
};
