import { useWalletContext } from '@/contexts/WalletContext/WalletContext';
import { CompensationClaim } from '@/services/compensations/model/compensation-claim';
import { isSameEVMAddress } from '@/services/evm/evm';
import { useMemo } from 'react';

export const useCompensationActionStatus = (compensation: CompensationClaim) => {
  const { evmAccount } = useWalletContext();

  const canWithdrawCompensation = useMemo(() => {
    return (
      compensation &&
      isSameEVMAddress(evmAccount, compensation.receivedCompensationAddress) &&
      !compensation.withdrawn
    );
  }, [compensation, evmAccount]);

  const hasAvailableAction = canWithdrawCompensation;

  return {
    canWithdrawCompensation,
    hasAvailableAction
  }
}