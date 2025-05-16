import { IconTooltip } from '@/components/base/IconTooltip';
import { Loading } from '@/components/base/Loading';
import { PageContainer } from '@/components/base/PageContainer';
import { PageTitle } from '@/components/base/PageTitle';
import { PageTitleRow } from '@/components/base/PageTitleRow';
import { Paginator } from '@/components/base/Paginator';
import { SearchInput } from '@/components/base/SearchInput';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { tooltips } from '@/config/tooltips';
import { CompensationType } from '@/services/compensations/model/compensation-claim';
import { useTransaction } from '@/services/transactions/hooks/contract/useTransaction';
import { useTransactions } from '@/services/transactions/hooks/useTransactions';
import { Transaction } from '@/services/transactions/model/transaction';
import { useDebounceInput } from '@/services/ui/hooks/useDebounceInput';
import { isNullOrUndefined } from '@/utils/isNullOrUndefined';
import { RefreshCwIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RequestArbiterFeeCompensationDialog } from './dialogs/RequestArbiterFeeCompensationDialog';
import { RequestFailedArbitrationCompensationDialog } from './dialogs/RequestFailedArbitrationCompensationDialog';
import { RequestIllegalSignatureCompensationDialog } from './dialogs/RequestIllegalSignatureCompensationDialog';
import { RequestTimeoutCompensationDialog } from './dialogs/RequestTimeoutCompensationDialog';
import { SubmitSignatureDialog } from './dialogs/SubmitSignatureDialog';
import { TransactionDetailsDialog } from './dialogs/TransactionDetailsDialog';
import { TransactionRow } from './TransactionRow';

export const transactionFieldLabels: Partial<Record<keyof Transaction, string>> = {
  id: 'ID',
  dapp: 'DApp',
  arbiter: 'Arbiter',
  deadline: 'Deadline',
  status: 'Status'
};

const ResultsPerPage = 9;

export default function TransactionList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchSubject, validatedSearch, typedSearch] = useDebounceInput();
  const {
    transactions,
    refreshTransactions,
    total: totalTransactionCount
  } = useTransactions(currentPage, ResultsPerPage, undefined, validatedSearch);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [openDialog, setOpenDialog] = useState<undefined | CompensationType | 'sign-arbitration' | 'details'>(
    undefined
  );
  const { transactionId: urlTransactionId } = useParams();
  const { fetchTransaction } = useTransaction(urlTransactionId);

  const loading = useMemo(() => isNullOrUndefined(transactions), [transactions]);

  // Refresh list when page loads
  useEffect(() => {
    void refreshTransactions();
  }, [refreshTransactions]);

  // If a transaction id is provided in the url, fetch it and open the dialog
  useEffect(() => {
    if (urlTransactionId) {
      void fetchTransaction().then(tx => {
        setSelectedTransaction(tx);
        if (tx) setOpenDialog('details');
      });
    }
  }, [urlTransactionId, fetchTransaction]);

  return (
    <PageContainer>
      <PageTitleRow>
        <PageTitle className='flex flex-grow sm:flex-grow-0'>
          Transactions{' '}
          <IconTooltip title='Transactions' tooltip={tooltips.transactionIntro} iconClassName='ml-2' iconSize={20} />
        </PageTitle>
        <div className='flex gap-2'>
          <Button variant='outline' size='icon' onClick={refreshTransactions}>
            <RefreshCwIcon />
          </Button>
          <SearchInput
            placeholder='Search transactions...'
            value={typedSearch}
            onChange={newValue => searchSubject.next(newValue)}
          />
        </div>
      </PageTitleRow>

      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              {Object.values(transactionFieldLabels).map(field => (
                <TableHead key={field}>{field}</TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions?.map((tx, index) => (
              <TransactionRow
                transaction={tx}
                key={index}
                onShowTransactionDetails={() => {
                  setSelectedTransaction(tx);
                  window.history.replaceState({}, '', `${window.location.pathname}/${tx.id}`);
                  setOpenDialog('details');
                }}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {loading && <Loading />}

      {!loading && totalTransactionCount === 0 && <div className='text-center'>Nothing yet</div>}

      <Paginator
        currentPage={currentPage}
        totalPages={Math.ceil((totalTransactionCount || 0) / ResultsPerPage)}
        onPageChange={setCurrentPage}
      />

      <TransactionDetailsDialog
        transaction={selectedTransaction}
        isOpen={openDialog === 'details'}
        onHandleClose={() => {
          window.history.replaceState({}, '', `/transactions`);
          setOpenDialog(undefined);
        }}
        onSubmitArbitration={() => {
          setOpenDialog('sign-arbitration');
        }}
        onRequestCompensation={compensationType => {
          setOpenDialog(compensationType);
        }}
      />

      <SubmitSignatureDialog
        transaction={selectedTransaction}
        isOpen={openDialog === 'sign-arbitration'}
        onHandleClose={() => setOpenDialog(undefined)}
      />
      <RequestFailedArbitrationCompensationDialog
        isOpen={openDialog === 'FailedArbitration'}
        transaction={selectedTransaction}
        onHandleClose={() => setOpenDialog(undefined)}
      />
      <RequestIllegalSignatureCompensationDialog
        isOpen={openDialog === 'IllegalSignature'}
        transaction={selectedTransaction}
        onHandleClose={() => setOpenDialog(undefined)}
      />
      <RequestTimeoutCompensationDialog
        isOpen={openDialog === 'Timeout'}
        transaction={selectedTransaction}
        onHandleClose={() => setOpenDialog(undefined)}
      />
      <RequestArbiterFeeCompensationDialog
        isOpen={openDialog === 'ArbiterFee'}
        transaction={selectedTransaction}
        onHandleClose={() => setOpenDialog(undefined)}
      />
    </PageContainer>
  );
}
