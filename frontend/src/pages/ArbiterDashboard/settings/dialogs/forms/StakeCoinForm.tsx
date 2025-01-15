import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useEVMBalance } from '@/services/evm/hooks/useEVMBalance';
import { FC, useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';

export const StakeCoinForm: FC<{
  form: UseFormReturn<{ coinAmount?: number }>;
}> = ({ form }) => {
  const activeChain = useActiveEVMChainConfig();
  const { balance } = useEVMBalance();

  const balanceInfo = useMemo(() => {
    if (!balance || !activeChain)
      return null;

    return <span className='ml-1'>
      (Balance: <span className='text-primary'>{balance.toFixed(3)}</span> {activeChain.nativeCurrency.symbol})
    </span>
  }, [balance, activeChain]);

  return (
    <FormField
      control={form.control}
      name="coinAmount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Amount {balanceInfo}</FormLabel>
          <Input type='number' step="1" {...field} />
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
