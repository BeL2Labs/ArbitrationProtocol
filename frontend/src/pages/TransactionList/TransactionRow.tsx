import { CopyField } from '@/components/base/CopyField';
import { StatusLabel } from '@/components/base/StatusLabel';
import { TokenWithValue } from '@/components/base/TokenWithValue';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { useWalletContext } from '@/contexts/WalletContext/WalletContext';
import { useArbiterFrozen } from '@/services/arbiters/hooks/contract/useArbiterFrozen';
import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { CompensationType } from '@/services/compensations/model/compensation-claim';
import { useConfigManager } from '@/services/config-manager/hooks/useConfigManager';
import { isSameEVMAddress } from '@/services/evm/evm';
import { Transaction } from '@/services/transactions/model/transaction';
import { transactionStatusLabelColor, transactionStatusLabelTitle } from '@/services/transactions/transactions.service';
import { formatDate } from '@/utils/dates';
import { formatAddress } from '@/utils/formatAddress';
import moment from 'moment';
import { FC, useEffect, useMemo, useState } from 'react';
import { transactionFieldLabels } from './TransactionList';

export const TransactionRow: FC<{
  transaction: Transaction;
  onSubmitArbitration: () => void;
  onRequestCompensation: (compensationType: CompensationType) => void;
}> = ({ transaction, onSubmitArbitration, onRequestCompensation }) => {
  const { evmAccount } = useWalletContext();
  const activeChain = useActiveEVMChainConfig();
  const { fetchArbiterFrozen } = useArbiterFrozen();
  const [isArbiterFrozen, setIsArbiterFrozen] = useState(undefined);
  const { configSettings } = useConfigManager();

  const formatValue = (key: keyof typeof transactionFieldLabels, value: any) => {
    if (key === 'id')
      return value ? <div className='flex flex-row items-center'>{formatAddress(value)} <CopyField value={value} /></div> : "-";

    if (key === 'startTime' || key === 'deadline')
      return value ? <div className='flex flex-row items-center'>{formatDate(value)} <CopyField value={value} /></div> : "-";

    if (key === 'status')
      return <StatusLabel title={transactionStatusLabelTitle(transaction)} color={transactionStatusLabelColor(transaction)} />

    if (key === 'dapp' || key === 'arbiter')
      return value ? <div className='flex flex-row items-center'>{formatAddress(value)} <CopyField value={value} /></div> : "-";

    if (key === 'depositedFee')
      return value ? <TokenWithValue amount={value} token={activeChain?.nativeCurrency} decimals={5} /> : "-";

    return value;
  };

  useEffect(() => {
    void fetchArbiterFrozen(transaction?.arbiter).then(setIsArbiterFrozen);
  }, [transaction, fetchArbiterFrozen]);

  const canSubmitArbitration = useMemo(() => {
    return (
      transaction.status === "Arbitrated" &&
      isSameEVMAddress(transaction.arbiter, evmAccount) &&
      moment().isBefore(transaction.deadline) &&
      !!configSettings &&
      moment().isBefore(transaction.requestArbitrationTime.add(Number(configSettings.arbitrationTimeout), "seconds"))
    );
  }, [transaction, evmAccount, configSettings]);

  /*
   * If transaction deadline is passed, and transaction is in arbitration,
   * then the timeoutCompensationReceiver can request a timeout compensation
   */
  const canRequestTimeoutCompensation = useMemo(() => {
    return (
      transaction.status === "Arbitrated" &&
      isSameEVMAddress(transaction.timeoutCompensationReceiver, evmAccount) &&
      // Follow the logic of transactionManager.isSubmitArbitrationOutTime()
      moment().isAfter(transaction.deadline) &&
      !!configSettings &&
      moment().isAfter(transaction.requestArbitrationTime.add(Number(configSettings.arbitrationTimeout), "seconds"))
    );
  }, [transaction, evmAccount, configSettings]);

  /**
   * Arbiter has submitted a signature but user considers this is a malicious activity from the arbiter.
   * User can submit a failed arbitration compensation request.
   */
  const canRequestFailedArbitrationCompensation = useMemo(() => {
    return (
      transaction.status === "Arbitrated" &&
      isSameEVMAddress(transaction.timeoutCompensationReceiver, evmAccount)
    );
  }, [transaction, evmAccount]);

  /**
   * Nobody submitted an arbitration request, but the arbiter might have collided with one of the
   * users to submit the bitcoin transaction. The other user can then submit the malicious transaction.
   */
  const canRequestIllegalSignatureCompensation = useMemo(() => {
    return (
      transaction.status !== "Arbitrated" &&
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
  const canCloseTransaction = useMemo(() => {
    const condition1 = isSameEVMAddress(transaction.arbiter, evmAccount) && transaction.status === "Active" && moment().isAfter(transaction.deadline);
    const condition2 = isSameEVMAddress(transaction.arbiter, evmAccount) && transaction.status === "Submitted" && isArbiterFrozen === false;
    return condition1 || condition2;
  }, [transaction, evmAccount, isArbiterFrozen]);

  return (
    <TableRow>
      {Object.keys(transactionFieldLabels).map((field: keyof Transaction) => (
        <TableCell key={field}>
          {formatValue(field, transaction[field as keyof Transaction])}
        </TableCell>
      ))}
      <TableCell className='flex flex-row gap-1'>
        {/* Transaction has an arbitration requested, so the arbiter can sign. */}
        {
          canSubmitArbitration &&
          <Button onClick={onSubmitArbitration}>Submit signature</Button>
        }

        {/* Request timeout compensation */}
        {
          canRequestTimeoutCompensation &&
          <Button onClick={() => onRequestCompensation("Timeout")}>Request compensation</Button>
        }

        {/* Request failed arbitration compensation */}
        {
          canRequestFailedArbitrationCompensation &&
          <Button onClick={() => onRequestCompensation("FailedArbitration")}>Request Failed Arbitration</Button>
        }

        {/* Request illegal signature compensation */}
        {
          canRequestIllegalSignatureCompensation &&
          <Button onClick={() => onRequestCompensation("IllegalSignature")}>Request Illegal Signature</Button>
        }

        {/* Close transaction */}
        {
          canCloseTransaction &&
          <Button onClick={() => onRequestCompensation("ArbitratorFee")}>Claim Arbiter Fee</Button>
        }

      </TableCell>
    </TableRow>
  )
}