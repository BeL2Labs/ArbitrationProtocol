import { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { useWalletContext } from '@/contexts/WalletContext/WalletContext';
import { Transaction } from '@/services/transactions/model/transaction';
import { useTransactions } from '@/services/transactions/hooks/useTransactions';
import { isNullOrUndefined } from '@/utils/isNullOrUndefined';
import { PageTitle } from '@/components/base/PageTitle';
import { SearchInput } from '@/components/base/SearchInput';
import { Loading } from '@/components/base/Loading';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/base/PageContainer';
import { PageTitleRow } from '@/components/base/PageTitleRow';
import { RefreshCwIcon } from 'lucide-react';

const statusMap = {
  0: 'Active',
  1: 'Completed',
  2: 'Arbitrated',
  3: 'Expired',
  4: 'Disputed'
};

const fieldLabels = {
  dapp: 'DApp Address',
  arbitrator: 'Arbitrator',
  startTime: 'Start Time',
  deadline: 'Deadline',
  btcTx: 'BTC Transaction',
  status: 'Status',
  depositedFee: 'Deposited Fee',
  signature: 'Signature'
};

export default function TransactionList() {
  const { transactions: rawTransactions, refreshTransactions } = useTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFields] = useState<string[]>(Object.keys(fieldLabels));
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [signature, setSignature] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmitArbitration = () => {
    if (!selectedTransaction || !signature) return;
    try {
      // TODO await contract.submitArbitration(selectedTransaction.dapp, signature);
      setIsSignDialogOpen(false);
      setSignature('');
    } catch (error) {
      console.error('Error submitting arbitration:', error);
    }
  };

  const transactions = useMemo(() => {
    return rawTransactions?.filter(tx => {
      const searchLower = searchTerm.toLowerCase();
      return (
        tx.dapp?.toLowerCase().includes(searchLower) ||
        tx.arbitrator?.toLowerCase().includes(searchLower) ||
        tx.btcTx?.toLowerCase().includes(searchLower)
      );
    });
  }, [rawTransactions, searchTerm]);

  const loading = useMemo(() => isNullOrUndefined(transactions), [transactions]);

  const formatValue = (key: string, value: any) => {
    if (key === 'startTime' || key === 'deadline') {
      return new Date(value).toLocaleString();
    }
    if (key === 'status') {
      return statusMap[value as keyof typeof statusMap];
    }
    // if (key === 'depositedFee') {
    //   return `${formatEther(value)} ETH`;
    // }
    if (key === 'dapp' || key === 'arbitrator') {
      return value?.slice(0, 10) + '...';
    }
    if (key === 'btcTx') {
      return value?.slice(0, 20) + '...';
    }
    return value;
  };

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <PageContainer>
      <PageTitleRow>
        <PageTitle className="flex flex-grow sm:flex-grow-0">Transaction List</PageTitle>
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
        <table className="min-w-full bg-white border rounded-lg">
          <thead>
            <tr>
              {selectedFields.map(field => (
                <th key={field} className="px-6 py-3 border-b text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  {fieldLabels[field as keyof typeof fieldLabels]}
                </th>
              ))}
              <th className="px-6 py-3 border-b text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions?.map((tx, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                {selectedFields.map(field => (
                  <td key={field} className="px-6 py-4 text-sm text-gray-900">
                    {formatValue(field, tx[field as keyof Transaction])}
                  </td>
                ))}
                <td className="px-6 py-4 text-sm">
                  {tx.status === "Active" && (
                    <Button
                      onClick={() => {
                        setSelectedTransaction(tx);
                        setIsSignDialogOpen(true);
                      }} >
                      Submit Arbitration
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && <Loading />}

      <Dialog
        open={isSignDialogOpen}
        onClose={() => setIsSignDialogOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-medium mb-4">
              Submit Arbitration
            </Dialog.Title>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Please sign the following BTC transaction using your BTC wallet:
              </p>
              <div className="bg-gray-100 p-3 rounded break-all">
                {selectedTransaction?.btcTx}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BTC Signature
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter your BTC signature"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsSignDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitArbitration}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg"
                disabled={!signature}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    </PageContainer>
  );
}
