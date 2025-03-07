import { useActiveEVMChainConfig } from "@/services/chains/hooks/useActiveEVMChainConfig";
import { useBehaviorSubject } from "@/utils/useBehaviorSubject";
import { useCallback, useEffect } from "react";
import { BehaviorSubject } from "rxjs";
import { fetchCompensations } from "../compensations.service";
import { CompensationClaim } from "../model/compensation-claim";

const state$ = new BehaviorSubject<{
  wasFetched: boolean; // Fetching has been tried once
  isPending: boolean; // Fetching is in progress
  compensations?: CompensationClaim[];
}>({ isPending: false, wasFetched: false });

export const useCompensations = () => {
  const activeChain = useActiveEVMChainConfig();
  const state = useBehaviorSubject(state$);

  const refreshCompensations = useCallback(async () => {
    state$.next({ isPending: true, wasFetched: false });
    if (activeChain) {
      const { compensations } = await fetchCompensations(activeChain, 0, 100);
      console.log("compensations", compensations)
      state$.next({ wasFetched: true, isPending: false, compensations });
    }
  }, [activeChain]);

  useEffect(() => {
    if (!state.wasFetched && !state.isPending)
      void refreshCompensations();
  }, [refreshCompensations, state]);

  return { refreshCompensations, ...state }
}