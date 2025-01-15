/* eslint-disable react-hooks/rules-of-hooks */
import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useBehaviorSubject } from '@/utils/useBehaviorSubject';
import { useCallback } from 'react';
import { BehaviorSubject } from 'rxjs';
import { ArbiterInfo } from '../model/arbiter-info';
import { useArbiterInfo } from './contract/useArbiterInfo';
import { useWalletContext } from '@/contexts/WalletContext/WalletContext';

const state$ = new BehaviorSubject<{ ownedArbiter?: ArbiterInfo; isPending: boolean, wasFetched: boolean }>({
  isPending: false,
  wasFetched: false
});

export const useOwnedArbiter = () => {
  const activeChain = useActiveEVMChainConfig();
  const { evmAccount } = useWalletContext();
  const state = useBehaviorSubject(state$);
  const { fetchArbiterInfo } = useArbiterInfo(evmAccount);

  const fetchOwnedArbiter = useCallback(async () => {
    state$.next({ ...state$.value, isPending: true, wasFetched: false });
    if (activeChain && evmAccount) {
      const arbiter = await fetchArbiterInfo();
      state$.next({ ownedArbiter: arbiter, isPending: false, wasFetched: true });
    } else {
      state$.next({ ...state$.value, isPending: false, wasFetched: true });
    }
  }, [activeChain, evmAccount, fetchArbiterInfo]);

  // Initial lazy fetch (first access)
  // useEffect(() => {
  //   if (!state.wasFetched && !state.isPending) {
  //     void fetchOwnedArbiter();
  //   }
  // }, [fetchOwnedArbiter, state]);

  return { fetchOwnedArbiter, ...state };
};