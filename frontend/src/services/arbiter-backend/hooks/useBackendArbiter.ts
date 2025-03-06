import { EvmChallengePayload } from "@/services/evm/hooks/useSignTypedData";
import { useBehaviorSubject } from "@/utils/useBehaviorSubject";
import { useCallback } from "react";
import { BehaviorSubject } from "rxjs";
import { fetchBackendArbiterStatus as fetchArbiterStatus, sendEmailVerificationPIN, upsertBackendArbiter as upsertArbiter } from "../arbiter-backend.service";
import { ArbiterStatusDTO } from "../dto/arbiter-status.dto";

const state$ = new BehaviorSubject<{
  isFetchingStatus: boolean;
  isPosting: boolean;
  status?: ArbiterStatusDTO;
}>({ isFetchingStatus: false, isPosting: false });

export const useBackendArbiter = (arbiterAddress: string) => {
  const state = useBehaviorSubject(state$);

  const fetchBackendArbiterStatus = useCallback(async () => {
    state$.next({ ...state$.value, isFetchingStatus: true });
    const status = await fetchArbiterStatus(arbiterAddress);
    state$.next({ ...state$.value, isFetchingStatus: false, status });
  }, [arbiterAddress]);

  const upsertBackendArbiter = useCallback(async (email: string, evmChallengePayload: EvmChallengePayload, signature: string): Promise<boolean> => {
    state$.next({ ...state$.value, isPosting: true });
    if (await upsertArbiter(arbiterAddress, email, evmChallengePayload, signature)) {
      state$.next({
        ...state$.value, isPosting: false
      });
      return true;
    }
    else {
      state$.next({ ...state$.value, isPosting: false });
      return false;
    }
  }, [arbiterAddress]);

  const sendEmailVerificationPinCode = useCallback(async (pinCode: string): Promise<boolean> => {
    state$.next({ ...state$.value, isPosting: true });
    if (await sendEmailVerificationPIN(arbiterAddress, pinCode)) {
      state$.next({
        ...state$.value, isPosting: false, status: {
          ...state$.value.status, emailKnown: true
        }
      });
      return true;
    }
    else {
      state$.next({ ...state$.value, isPosting: false });
      return false;
    }
  }, [arbiterAddress]);

  return {
    ...state,
    fetchBackendArbiterStatus,
    upsertBackendArbiter,
    sendEmailVerificationPinCode
  };
}