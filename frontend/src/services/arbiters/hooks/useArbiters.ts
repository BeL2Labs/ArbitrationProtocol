import { useActiveEVMChainConfig } from "@/services/chains/hooks/useActiveEVMChainConfig";
import { useBehaviorSubject } from "@/utils/useBehaviorSubject";
import { useCallback, useEffect, useState } from "react";
import { BehaviorSubject } from "rxjs";
import { fetchArbiters as fetchSubgraphArbiters } from "../arbiters.service";
import { ArbiterInfo } from "../model/arbiter-info";
import { useMultiArbiterInfo } from "./contract/useMultiArbiterInfo";
import { useMultiArbiterIsActive } from "./contract/useMultiArbiterIsActive";
import { useMultiArbiterStakeValue } from "./contract/useMultiArbiterStakeValue";

const state$ = new BehaviorSubject<{
  wasFetched: boolean; // Fetching has been tried once
  isPending: boolean; // Fetching is in progress
  arbiters?: ArbiterInfo[];
}>({ isPending: false, wasFetched: false });

export const useArbiters = (
  currentPage: number,
  resultsPerPage: number,
  search?: string
) => {
  const activeChain = useActiveEVMChainConfig();
  const state = useBehaviorSubject(state$);
  const { fetchMultiArbiterIsActive } = useMultiArbiterIsActive();
  const { fetchMultiArbiterStakeValue } = useMultiArbiterStakeValue();
  const { fetchMultiArbiterInfo } = useMultiArbiterInfo();
  const [total, setTotal] = useState(undefined);

  const fetchArbiters = useCallback(async () => {
    state$.next({ isPending: true, wasFetched: false });
    if (activeChain) {
      const { arbiters: graphArbiters, total: _total } =
        await fetchSubgraphArbiters(
          activeChain,
          (currentPage - 1) * resultsPerPage,
          resultsPerPage,
          { search }
        );

      if (graphArbiters) {
        setTotal(_total);

        // Only use the subgraph for the arbiters, but real details are fetched from contract through multicall
        const arbiterIds = graphArbiters.map((a) => a.id);
        const arbiters = await fetchMultiArbiterInfo(arbiterIds);

        if (arbiters) {
          const isActives = await fetchMultiArbiterIsActive(arbiterIds);
          const stakes = await fetchMultiArbiterStakeValue(arbiterIds);

          if (isActives && stakes) {
            arbiters.forEach((arbiter, i) => {
              arbiter.isActive = isActives[i];
              arbiter.totalValue = stakes[i];
            });
          }
        }
        state$.next({ isPending: false, wasFetched: true, arbiters });
        return;
      }

      state$.next({ isPending: false, wasFetched: true, arbiters: undefined });
    }
  }, [
    activeChain,
    currentPage,
    resultsPerPage,
    search,
    fetchMultiArbiterInfo,
    fetchMultiArbiterIsActive,
    fetchMultiArbiterStakeValue,
  ]);

  // Initial lazy fetch (first access)
  useEffect(() => {
    if (!state.wasFetched && !state.isPending) void fetchArbiters();
  }, [fetchArbiters, state]);

  return { fetchArbiters, total, ...state };
};
