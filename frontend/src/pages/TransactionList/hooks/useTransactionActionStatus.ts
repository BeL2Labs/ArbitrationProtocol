import { useWalletContext } from '@/contexts/WalletContext/WalletContext';
import { useArbiterFrozen } from '@/services/arbiters/hooks/contract/useArbiterFrozen';
import { useConfigManager } from '@/services/config-manager/hooks/useConfigManager';
import { isSameEVMAddress } from '@/services/evm/evm';
import { Transaction } from '@/services/transactions/model/transaction';
import moment from 'moment';
import { useEffect, useMemo, useState } from 'react';

export const useTransactionActionStatus = (transaction: Transaction) => {
  const { evmAccount } = useWalletContext();
  const [isArbiterFrozen, setIsArbiterFrozen] = useState(undefined);
  const { configSettings } = useConfigManager();
  const { fetchArbiterFrozen } = useArbiterFrozen();

  useEffect(() => {
    void fetchArbiterFrozen(transaction?.arbiter).then(setIsArbiterFrozen);
  }, [transaction, fetchArbiterFrozen]);

  const canSubmitArbitration = useMemo(() => {
    return (
      transaction &&
      // Note: important to use stored status here, not dynamic status.
      transaction.status === 'Arbitrated' &&
      isSameEVMAddress(transaction.arbiter, evmAccount) &&
      moment().isBefore(transaction.deadline) &&
      !!configSettings &&
      moment().isBefore(
        transaction.requestArbitrationTime.clone().add(Number(configSettings.arbitrationTimeout), 'seconds')
      )
    );
  }, [transaction, evmAccount, configSettings]);

  /*
   * If transaction deadline is passed, and transaction is in arbitration,
   * then the timeoutCompensationReceiver can request a timeout compensation
   */
  const canRequestTimeoutCompensation = useMemo(() => {
    return (
      transaction &&
      // Note: important to use stored status here, not dynamic status.
      transaction.status === 'Arbitrated' &&
      isSameEVMAddress(transaction.timeoutCompensationReceiver, evmAccount) &&
      // Follow the logic of transactionManager.isSubmitArbitrationOutTime()
      moment().isAfter(transaction.deadline) &&
      !!configSettings &&
      moment().isAfter(
        transaction.requestArbitrationTime.clone().add(Number(configSettings.arbitrationTimeout), 'seconds')
      )
    );
  }, [transaction, evmAccount, configSettings]);

  /**
   * Arbiter has submitted a signature but user considers this is a malicious activity from the arbiter.
   * User can submit a failed arbitration compensation request.
   */
  const canRequestFailedArbitrationCompensation = useMemo(() => {
    return (
      transaction &&
      // Note: important to use stored status here, not dynamic status.
      transaction.status === 'Arbitrated' &&
      isSameEVMAddress(transaction.timeoutCompensationReceiver, evmAccount)
    );
  }, [transaction, evmAccount]);

  /**
   * Nobody submitted an arbitration request, but the arbiter might have collided with one of the
   * users to submit the bitcoin transaction. The other user can then submit the malicious transaction.
   */
  const canRequestIllegalSignatureCompensation = useMemo(() => {
    return (
      transaction &&
      // Note: important to use stored status here, not dynamic status.
      transaction.status !== 'Arbitrated' &&
      transaction.status !== 'Completed' &&
      isSameEVMAddress(transaction.compensationReceiver, evmAccount)
    );
  }, [transaction, evmAccount]);

  /**
   * Condition 1:
   * - Only the arbiter.
   * - If the transaction status is active, and the deadline has passed.
   *
   * Condition 2:
   * - Only the arbiter.
   * - Status is submitted and arbiter is not frozen
   */
  const canClaimArbiterFee = useMemo(() => {
    if (!transaction) return false;

    // Note: important to use stored status here, not dynamic status.

    const condition1 =
      isSameEVMAddress(transaction.arbiter, evmAccount) &&
      transaction.status === 'Active' &&
      moment().isAfter(transaction.deadline);

    const condition2 =
      isSameEVMAddress(transaction.arbiter, evmAccount) &&
      transaction.status === 'Submitted' &&
      isArbiterFrozen === false;

    return condition1 || condition2;
  }, [transaction, evmAccount, isArbiterFrozen]);

  const hasAvailableAction =
    canSubmitArbitration ||
    canRequestTimeoutCompensation ||
    canRequestFailedArbitrationCompensation ||
    canRequestIllegalSignatureCompensation ||
    canClaimArbiterFee;

  return {
    canSubmitArbitration,
    canRequestTimeoutCompensation,
    canRequestFailedArbitrationCompensation,
    canRequestIllegalSignatureCompensation,
    canClaimArbiterFee,

    hasAvailableAction
  };
};
