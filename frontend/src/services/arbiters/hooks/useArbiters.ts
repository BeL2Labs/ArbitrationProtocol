import { useActiveEVMChainConfig } from "@/services/chains/hooks/useActiveEVMChainConfig";
import { useBehaviorSubject } from "@/utils/useBehaviorSubject";
import { useCallback, useEffect } from "react";
import { BehaviorSubject } from "rxjs";
import { fetchArbiters as fetchArbitersApi } from "../arbiters.service";
import { ArbiterInfo } from "../model/arbiter-info";
import { useMultiArbiterInfo } from "./contract/useMultiArbiterInfo";
import { useMultiArbiterIsActive } from "./contract/useMultiArbiterIsActive";
import { useMultiArbiterStakeValue } from "./contract/useMultiArbiterStakeValue";

const state$ = new BehaviorSubject<{
  wasFetched: boolean; // Fetching has been tried once
  isPending: boolean; // Fetching is in progress
  arbiters?: ArbiterInfo[];
}>({ isPending: false, wasFetched: false });

export const useArbiters = () => {
  const activeChain = useActiveEVMChainConfig();
  const state = useBehaviorSubject(state$);
  const { fetchMultiArbiterIsActive } = useMultiArbiterIsActive();
  const { fetchMultiArbiterStakeValue } = useMultiArbiterStakeValue();
  const { fetchMultiArbiterInfo } = useMultiArbiterInfo();

  const fetchArbiters = useCallback(async () => {
    state$.next({ isPending: true, wasFetched: false });
    if (activeChain) {
      const { arbiters: graphArbiters } = await fetchArbitersApi(activeChain);

      if (graphArbiters) {
        // Only use the subgraph for the arbiters, but real details are fetched from contract through multicall
        const arbiterIds = graphArbiters.map(a => a.id);
        const arbiters = await fetchMultiArbiterInfo(arbiterIds);
        if (arbiters) {
          const isActives = await fetchMultiArbiterIsActive(arbiterIds);
          const stakes = await fetchMultiArbiterStakeValue(arbiterIds);

          if (isActives && stakes) {
            arbiters.forEach((arbiter, i) => {
              console.log("stake for arbiter ", arbiter.address, stakes[i].toString())
              arbiter.isActive = isActives[i];
              arbiter.totalValue = stakes[i];
            });

            console.log("Reworked arbiters", arbiters);
          }
        }
        state$.next({ isPending: false, wasFetched: true, arbiters });
        return;
      }

      state$.next({ isPending: false, wasFetched: true, arbiters: undefined });
    }
  }, [activeChain, fetchMultiArbiterInfo, fetchMultiArbiterStakeValue, fetchMultiArbiterIsActive]);

  // Initial lazy fetch (first access)
  useEffect(() => {
    if (!state.wasFetched && !state.isPending)
      void fetchArbiters();
  }, [fetchArbiters, state]);

  return { fetchArbiters, ...state }
}