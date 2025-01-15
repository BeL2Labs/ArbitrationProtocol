import { CopyField } from '@/components/base/CopyField';
import { StatusLabel } from '@/components/base/StatusLabel';
import { TokenWithValue } from '@/components/base/TokenWithValue';
import { DetailsTableCellWithLabel } from '@/components/dialogs/parts/DetailsTableCellWithLabel';
import { DetailsTableCellWithValue } from '@/components/dialogs/parts/DetailsTableCellWithValue';
import { DetailsTableRow } from '@/components/dialogs/parts/DetailsTableRow';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody } from '@/components/ui/table';
import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { CompensationType } from '@/services/compensations/model/compensation-claim';
import { Transaction } from '@/services/transactions/model/transaction';
import { transactionStatusLabelColor, transactionStatusLabelTitle } from '@/services/transactions/transactions.service';
import { formatDate } from '@/utils/dates';
import { formatAddress } from '@/utils/formatAddress';
import { FC } from 'react';
import { useTransactionActionStatus } from '../hooks/useTransactionActionStatus';

export const TransactionDetailsDialog: FC<{
  transaction: Transaction;
  isOpen: boolean;
  onSubmitArbitration: () => void;
  onRequestCompensation: (compensationType: CompensationType) => void;
  onHandleClose: () => void;
}> = ({ transaction, isOpen, onHandleClose, onSubmitArbitration, onRequestCompensation }) => {
  const activeChain = useActiveEVMChainConfig();
  const { hasAvailableAction, canSubmitArbitration, canRequestTimeoutCompensation, canRequestFailedArbitrationCompensation, canRequestIllegalSignatureCompensation, canCloseTransaction } = useTransactionActionStatus(transaction);

  if (!transaction)
    return null;

  return <Dialog open={isOpen} onOpenChange={onHandleClose}>
    {/* Prevent focus for tooltip not to auto show */}
    <DialogContent aria-description="Transaction details" onOpenAutoFocus={e => e.preventDefault()}>
      <DialogHeader>
        <DialogTitle className='gap-4 flex items-center'>
          Transaction details
          <StatusLabel title={transactionStatusLabelTitle(transaction)} color={transactionStatusLabelColor(transaction)} />
        </DialogTitle>
        <DialogDescription className="flex gap-1 items-center">
          {formatAddress(transaction.id, [14, 12])}
          <CopyField value={transaction.id} />
        </DialogDescription>
      </DialogHeader>

      <Table>
        <TableBody>
          <DetailsTableRow>
            <DetailsTableCellWithLabel>DApp</DetailsTableCellWithLabel>
            <DetailsTableCellWithValue>{formatAddress(transaction.dapp, [10, 8])} <CopyField value={transaction.dapp} /></DetailsTableCellWithValue>
          </DetailsTableRow>
          <DetailsTableRow>
            <DetailsTableCellWithLabel>Arbiter</DetailsTableCellWithLabel>
            <DetailsTableCellWithValue>{formatAddress(transaction.arbiter, [10, 8])} <CopyField value={transaction.arbiter} /></DetailsTableCellWithValue>
          </DetailsTableRow>
          <DetailsTableRow>
            <DetailsTableCellWithLabel>Start time</DetailsTableCellWithLabel>
            <DetailsTableCellWithValue>{formatDate(transaction.startTime)}</DetailsTableCellWithValue>
          </DetailsTableRow>
          <DetailsTableRow>
            <DetailsTableCellWithLabel>Deadline</DetailsTableCellWithLabel>
            <DetailsTableCellWithValue>{formatDate(transaction.deadline)}</DetailsTableCellWithValue>
          </DetailsTableRow>
          <DetailsTableRow>
            <DetailsTableCellWithLabel>Deposited Fee</DetailsTableCellWithLabel>
            <DetailsTableCellWithValue>{transaction.depositedFee ? <TokenWithValue amount={transaction.depositedFee} token={activeChain?.nativeCurrency} decimals={5} /> : "-"}</DetailsTableCellWithValue>
          </DetailsTableRow>
        </TableBody>
      </Table>

      {/* Actions */}
      {hasAvailableAction &&
        <div className="flex pt-2 justify-end gap-2">
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
            <Button onClick={() => onRequestCompensation("ArbiterFee")}>Claim Arbiter Fee</Button>
          }
        </div>
      }
    </DialogContent>
  </Dialog>
}