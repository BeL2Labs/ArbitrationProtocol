import { CopyField } from '@/components/base/CopyField';
import { StatusLabel } from '@/components/base/StatusLabel';
import { TokenWithValue } from '@/components/base/TokenWithValue';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { useTransactionActionStatus } from '@/pages/TransactionList/hooks/useTransactionActionStatus';
import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { TokenOrNative } from '@/services/tokens/token-or-native';
import { getTokenBySymbol } from '@/services/tokens/tokens';
import { Transaction } from '@/services/transactions/model/transaction';
import { transactionStatusLabelColor, transactionStatusLabelTitle } from '@/services/transactions/transactions.service';
import { formatDate } from '@/utils/dates';
import { formatAddress } from '@/utils/formatAddress';
import { BookTextIcon } from 'lucide-react';
import { FC, useEffect, useState } from 'react';
import { ArbiterTransactionColumn, transactionFieldLabels } from './ArbiterTransactions';

export const TransactionRow: FC<{
  transaction: Transaction;
  onShowTransactionDetails: () => void;
}> = ({ transaction, onShowTransactionDetails }) => {
  const activeChain = useActiveEVMChainConfig();
  const { hasAvailableAction } = useTransactionActionStatus(transaction);
  const [rewardValue, setRewardValue] = useState<number>(undefined);
  const [rewardToken, setRewardToken] = useState<TokenOrNative>(undefined);

  useEffect(() => {
    if (transaction) {
      if (transaction.arbitratorFeeNative.gt(0)) {
        setRewardValue(transaction.arbitratorFeeNative.toNumber());
        setRewardToken(activeChain?.nativeCurrency);
      } else if (transaction.arbitratorFeeBTC.gt(0)) {
        setRewardValue(transaction.arbitratorFeeBTC.toNumber());
        setRewardToken(getTokenBySymbol(activeChain, "BTC"));
      }
      else {
        setRewardValue(0);
        setRewardToken(undefined);
      }
    }
  }, [activeChain, transaction]);

  const formatValue = (key: keyof typeof transactionFieldLabels, value: any) => {
    if (key === 'id')
      return value ? <div className='flex flex-row items-center'>{formatAddress(value)} <CopyField value={value} /></div> : "-";

    if (key === 'startTime' || key === 'deadline')
      return value ? <div className='flex flex-row items-center'>{formatDate(value)} <CopyField value={value} /></div> : "-";

    if (key === 'status')
      return <StatusLabel title={transactionStatusLabelTitle(transaction)} color={transactionStatusLabelColor(transaction)} />

    if (key === 'dapp')
      return value ? <div className='flex flex-row items-center'>{formatAddress(value)} <CopyField value={value} /></div> : "-";

    if (key === 'depositedFee')
      return value ? <TokenWithValue amount={value} token={activeChain?.nativeCurrency} decimals={5} /> : "-";

    if (key === 'reward')
      return rewardToken ? <TokenWithValue amount={rewardValue} token={rewardToken} decimals={5} /> : "-";

    return value;
  };

  return (
    <TableRow onClick={onShowTransactionDetails} className="cursor-pointer">
      {Object.keys(transactionFieldLabels).map((field: ArbiterTransactionColumn) => (
        <TableCell key={field}>
          {formatValue(field, transaction[field as ArbiterTransactionColumn])}
        </TableCell>
      ))}
      <TableCell>
        {hasAvailableAction && <Button variant="link"><BookTextIcon size={12} /></Button>}
      </TableCell>
    </TableRow>
  )
}