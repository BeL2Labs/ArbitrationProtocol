import { IconTooltip } from '@/components/base/IconTooltip';
import { Loading } from '@/components/base/Loading';
import { PageTitle } from '@/components/base/PageTitle';
import { PageTitleRow } from '@/components/base/PageTitleRow';
import { SearchInput } from '@/components/base/SearchInput';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { tooltips } from '@/config/tooltips';
import { useWalletContext } from '@/contexts/WalletContext/WalletContext';
import { RequestArbiterFeeCompensationDialog } from '@/pages/TransactionList/dialogs/RequestArbiterFeeCompensationDialog';
import { SubmitSignatureDialog } from '@/pages/TransactionList/dialogs/SubmitSignatureDialog';
import { TransactionDetailsDialog } from '@/pages/TransactionList/dialogs/TransactionDetailsDialog';
import { CompensationType } from '@/services/compensations/model/compensation-claim';
import { useTransactions } from '@/services/transactions/hooks/useTransactions';
import { Transaction } from '@/services/transactions/model/transaction';
import { isNullOrUndefined } from '@/utils/isNullOrUndefined';
import { RefreshCwIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { TransactionRow } from './TransactionRow';
import { RequestIllegalSignatureCompensationDialog } from '@/pages/TransactionList/dialogs/RequestIllegalSignatureCompensationDialog';

export type ArbiterTransactionColumn = keyof Transaction | "reward";

export const transactionFieldLabels: Partial<Record<ArbiterTransactionColumn, string>> = {
  id: 'ID',
  dapp: 'DApp',
  deadline: 'Deadline',
  reward: 'Reward',
  status: 'Status',
};

export default function ArbiterTransactions() {
  const { evmAccount } = useWalletContext();
  const { transactions: rawTransactions, refreshTransactions } = useTransactions(1, 500, evmAccount);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [openDialog, setOpenDialog] = useState<undefined | CompensationType | "sign-arbitration" | "details">(undefined);

  const transactions = useMemo(() => {
    return rawTransactions?.filter(tx => {
      const searchLower = searchTerm.toLowerCase();
      return (
        tx.id?.toLowerCase().includes(searchLower) ||
        tx.dapp?.toLowerCase().includes(searchLower) ||
        tx.arbiter?.toLowerCase().includes(searchLower)
      );
    });
  }, [rawTransactions, searchTerm]);

  const loading = useMemo(() => isNullOrUndefined(transactions), [transactions]);

  // Refresh list when page loads
  useEffect(() => {
    void refreshTransactions();
  }, [refreshTransactions]);

  return (
    <div className='flex flex-col gap-4'>
      <PageTitleRow>
        <PageTitle className="flex flex-grow sm:flex-grow-0">Transactions <IconTooltip title='Transactions' tooltip={tooltips.transactionIntro} iconClassName='ml-2' iconSize={20} /></PageTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={refreshTransactions}>
            <RefreshCwIcon />
          </Button>
          <SearchInput placeholder="Search transactions..."
            value={searchTerm}
            onChange={(newValue) => setSearchTerm(newValue)} />
        </div>
      </PageTitleRow>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {Object.values(transactionFieldLabels).map(field => (
                <TableHead key={field}>
                  {field}
                </TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions?.map((tx, index) => <TransactionRow
              transaction={tx}
              key={index}
              onShowTransactionDetails={() => {
                setSelectedTransaction(tx);
                window.history.replaceState({}, '', `${window.location.pathname}/${tx.id}`);
                setOpenDialog("details");
              }}
            />)}
          </TableBody>
        </Table>
      </div>

      {loading && <Loading />}

      <TransactionDetailsDialog
        transaction={selectedTransaction}
        isOpen={openDialog === "details"}
        onHandleClose={() => {
          window.history.replaceState({}, '', `/transactions`);
          setOpenDialog(undefined);
        }}
        onSubmitArbitration={() => {
          setOpenDialog("sign-arbitration");
        }}
        onRequestCompensation={(compensationType) => {
          setOpenDialog(compensationType);
        }}
      />

      <SubmitSignatureDialog transaction={selectedTransaction} isOpen={openDialog === "sign-arbitration"} onHandleClose={() => setOpenDialog(undefined)} />
      <RequestIllegalSignatureCompensationDialog isOpen={openDialog === "IllegalSignature"} transaction={selectedTransaction} onHandleClose={() => setOpenDialog(undefined)} />
      <RequestArbiterFeeCompensationDialog isOpen={openDialog === "ArbiterFee"} transaction={selectedTransaction} onHandleClose={() => setOpenDialog(undefined)} />
    </div>
  );
}

