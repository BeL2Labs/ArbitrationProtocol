import { IconTooltip } from '@/components/base/IconTooltip';
import { Loading } from '@/components/base/Loading';
import { PageTitle } from '@/components/base/PageTitle';
import { PageTitleRow } from '@/components/base/PageTitleRow';
import { SearchInput } from '@/components/base/SearchInput';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { tooltips } from '@/config/tooltips';
import { RequestArbiterFeeCompensationDialog } from '@/pages/TransactionList/dialogs/RequestArbiterFeeCompensationDialog';
import { RequestIllegalSignatureCompensationDialog } from '@/pages/TransactionList/dialogs/RequestIllegalSignatureCompensationDialog';
import { SubmitSignatureDialog } from '@/pages/TransactionList/dialogs/SubmitSignatureDialog';
import { TransactionDetailsDialog } from '@/pages/TransactionList/dialogs/TransactionDetailsDialog';
import { useOwnedArbiter } from '@/services/arbiters/hooks/useOwnedArbiter';
import { CompensationType } from '@/services/compensations/model/compensation-claim';
import { useBTCFees } from '@/services/transactions/hooks/useBTCFees';
import { useTransactions } from '@/services/transactions/hooks/useTransactions';
import { Transaction } from '@/services/transactions/model/transaction';
import { isNullOrUndefined } from '@/utils/isNullOrUndefined';
import { RefreshCwIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { WithdrawBTCFeesDialog } from './dialogs/WithdrawBTCFees';
import { TransactionFilter, TransactionFilterType } from './TransactionFilter';
import { TransactionRow } from './TransactionRow';

export type ArbiterTransactionColumn = keyof Transaction | 'selection' | 'reward' | 'btcFee';

export const transactionFieldLabels: Partial<Record<ArbiterTransactionColumn, string>> = {
  selection: '',
  id: 'ID',
  dapp: 'DApp',
  deadline: 'Deadline',
  reward: 'Reward',
  btcFee: 'Unclaimed',
  status: 'Status'
};

export default function ArbiterTransactions() {
  const { ownedArbiter } = useOwnedArbiter();
  const { transactions: rawTransactions, refreshTransactions } = useTransactions(1, 500, ownedArbiter?.address ?? null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pickedTransaction, setPickedTransaction] = useState<Transaction | null>(null); // Transaction we want to show details of
  const [selectedTransactions, setSelectedTransactions] = useState<Transaction[]>([]); // Transactions that got selected for BTC fee withdrawal
  const [openDialog, setOpenDialog] = useState<
    undefined | CompensationType | 'sign-arbitration' | 'details' | 'withdraw-btc-fees'
  >(undefined);
  const btcFeesInfo = useBTCFees(rawTransactions);
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilterType>('all');

  const transactions = useMemo(() => {
    // Filter with search field
    const searchFiltered = rawTransactions?.filter(tx => {
      const searchLower = searchTerm.toLowerCase();
      return (
        tx.id?.toLowerCase().includes(searchLower) ||
        tx.dapp?.toLowerCase().includes(searchLower) ||
        tx.arbiter?.toLowerCase().includes(searchLower)
      );
    });

    // Filter with transaction filter
    const txTypeFiltered = searchFiltered?.filter(tx => {
      switch (transactionFilter) {
        case 'all':
          return true;
        case 'with-btc-fee-balance':
          return btcFeesInfo?.[tx.id]?.withdrawableAmountBTC?.gt(0);
      }
    });

    return txTypeFiltered;
  }, [btcFeesInfo, rawTransactions, searchTerm, transactionFilter]);

  const loading = useMemo(() => isNullOrUndefined(transactions), [transactions]);

  const handleRowSelectionChanged = useCallback(
    (transaction: Transaction, selected: boolean) => {
      if (selected) {
        // select
        setSelectedTransactions(selectedTransactions.concat([transaction]));
      } else {
        // Unselect
        setSelectedTransactions(selectedTransactions.filter(tx => tx.id !== transaction.id));
      }
    },
    [selectedTransactions]
  );

  const handleWithdrawBTCFeesSubmitted = useCallback(() => {
    setSelectedTransactions([]);
  }, []);

  // Refresh list when page loads
  useEffect(() => {
    void refreshTransactions();
  }, [refreshTransactions]);

  return (
    <div className='flex flex-col'>
      <PageTitleRow>
        <PageTitle className='flex flex-grow sm:flex-grow-0'>
          Transactions{' '}
          <IconTooltip title='Transactions' tooltip={tooltips.transactionIntro} iconClassName='ml-2' iconSize={20} />
        </PageTitle>
        <div className='flex gap-2'>
          <TransactionFilter value={transactionFilter} onChange={setTransactionFilter} />
          <Button variant='outline' size='icon' onClick={refreshTransactions}>
            <RefreshCwIcon />
          </Button>
          <SearchInput
            placeholder='Search transactions...'
            value={searchTerm}
            onChange={newValue => setSearchTerm(newValue)}
          />
        </div>
      </PageTitleRow>

      <div className='overflow-x-auto'>
        {!ownedArbiter && <div>No arbiter owned yet</div>}
        {ownedArbiter && (
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
                  btcFeesInfo={btcFeesInfo?.[tx.id]}
                  onShowTransactionDetails={() => {
                    setPickedTransaction(tx);
                    window.history.replaceState({}, '', `${window.location.pathname}/${tx.id}`);
                    setOpenDialog('details');
                  }}
                  onRowSelection={selected => handleRowSelectionChanged(tx, selected)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {
        /* Button to start withdrawing btc fees, when some withdrawable transactions have been selected in the list */
        selectedTransactions?.length > 0 && (
          <div className='flex justify-end'>
            <Button onClick={() => setOpenDialog('withdraw-btc-fees')}>Withdraw BTC fees</Button>
          </div>
        )
      }

      {loading && <Loading />}

      <TransactionDetailsDialog
        transaction={pickedTransaction}
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
        transaction={pickedTransaction}
        isOpen={openDialog === 'sign-arbitration'}
        onHandleClose={() => setOpenDialog(undefined)}
      />
      <RequestIllegalSignatureCompensationDialog
        isOpen={openDialog === 'IllegalSignature'}
        transaction={pickedTransaction}
        onHandleClose={() => setOpenDialog(undefined)}
      />
      <RequestArbiterFeeCompensationDialog
        isOpen={openDialog === 'ArbiterFee'}
        transaction={pickedTransaction}
        onHandleClose={() => setOpenDialog(undefined)}
      />
      <WithdrawBTCFeesDialog
        arbiter={ownedArbiter}
        isOpen={openDialog === 'withdraw-btc-fees'}
        btcFeesInfo={btcFeesInfo}
        withdrawableTransactions={selectedTransactions}
        onHandleClose={() => setOpenDialog(undefined)}
        onTransactionSubmitted={handleWithdrawBTCFeesSubmitted}
      />
    </div>
  );
}
