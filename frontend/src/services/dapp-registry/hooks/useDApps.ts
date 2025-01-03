import { useActiveEVMChainConfig } from "@/services/chains/hooks/useActiveEVMChainConfig";
import { useBehaviorSubject } from "@/utils/useBehaviorSubject";
import { useCallback, useEffect } from "react";
import { BehaviorSubject } from "rxjs";
import { fetchDApps } from "../dapp-registry.service";
import { DApp } from "../model/dapp";

const state$ = new BehaviorSubject<{
  wasFetched: boolean; // Fetching has been tried once
  isPending: boolean; // Fetching is in progress
  dapps?: DApp[];
}>({ isPending: false, wasFetched: false });

export const useDApps = () => {
  const activeChain = useActiveEVMChainConfig();
  const state = useBehaviorSubject(state$);

  const refreshDapps = useCallback(async () => {
    state$.next({ isPending: true, wasFetched: false });
    if (activeChain) {
      const { dapps } = await fetchDApps(activeChain, 0, 100);
      state$.next({ isPending: false, wasFetched: true, dapps });
    }
  }, [activeChain]);

  // Initial lazy fetch (first access)
  useEffect(() => {
    if (!state.wasFetched && !state.isPending)
      void refreshDapps();
  }, [refreshDapps, state]);

  return { refreshDapps, ...state }
}