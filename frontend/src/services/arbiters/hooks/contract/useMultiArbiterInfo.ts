import { useActiveEVMChainConfig } from "@/services/chains/hooks/useActiveEVMChainConfig";
import { useMulticall } from "@/services/multicall/hooks/contract/useMulticall";
import { useCallback } from "react";
import { abi } from "../../../../../contracts/core/ArbitratorManager.sol/ArbitratorManager.json";
import {
  ContractArbiterAssets,
  ContractArbiterBasicInfo,
  ContractArbiterOperationInfo,
  ContractArbiterRevenueInfo,
} from "../../dto/contract-arbiter-info";
import { ArbiterInfo } from "../../model/arbiter-info";

/**
 * Multicall request to get multiple arbiter at once (subgraph state is hard to keep in sync with contract...)
 */
export const useMultiArbiterInfo = () => {
  const activeChain = useActiveEVMChainConfig();
  const { singleContractMulticall } = useMulticall();

  const fetchMultiArbiterInfo = useCallback(
    async (arbiterIds: string[]): Promise<ArbiterInfo[]> => {
      const multiCallParams = arbiterIds.flatMap((arbiterId) => [
        { functionName: "getArbitratorBasicInfo", multiArgs: [arbiterId] },
        { functionName: "getArbitratorOperationInfo", multiArgs: [arbiterId] },
        { functionName: "getArbitratorRevenueInfo", multiArgs: [arbiterId] },
        { functionName: "getArbitratorAssets", multiArgs: [arbiterId] },
      ]);

      const resultsPerArbiter = multiCallParams.length / arbiterIds.length;

      const multiContractArbiters = await singleContractMulticall<
        | ContractArbiterBasicInfo
        | ContractArbiterOperationInfo
        | ContractArbiterRevenueInfo
        | ContractArbiterAssets
      >(abi, activeChain!.contracts.arbitratorManager, multiCallParams);

      if (!multiContractArbiters) {
        return undefined;
      }

      // Multicall results for the same arbiter (X methods) are every X elements. We sort this out.
      const contractArbiterBasicInfo = multiContractArbiters.filter(
        (_, i) => i % resultsPerArbiter === 0
      ) as ContractArbiterBasicInfo[];
      const contractArbiterOperationInfo = multiContractArbiters.filter(
        (_, i) => i % resultsPerArbiter === 1
      ) as ContractArbiterOperationInfo[];
      const contractArbiterRevenueInfo = multiContractArbiters.filter(
        (_, i) => i % resultsPerArbiter === 2
      ) as ContractArbiterRevenueInfo[];
      const contractArbiterAssets = multiContractArbiters.filter(
        (_, i) => i % resultsPerArbiter === 3
      ) as ContractArbiterAssets[];

      return contractArbiterBasicInfo.map((_, i) =>
        ArbiterInfo.fromContractArbiterInfo(
          contractArbiterBasicInfo[i],
          contractArbiterOperationInfo[i],
          contractArbiterRevenueInfo[i],
          contractArbiterAssets[i]
        )
      );
    },
    [activeChain, singleContractMulticall]
  );

  return { fetchMultiArbiterInfo };
};
