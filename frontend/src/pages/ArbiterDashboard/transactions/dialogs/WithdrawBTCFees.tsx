import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArbiterInfo } from "@/services/arbiters/model/arbiter-info";
import { Transaction } from "@/services/transactions/model/transaction";
import { useToasts } from "@/services/ui/hooks/useToasts";
import { CheckIcon } from "lucide-react";
import { FC, useCallback, useMemo, useState } from "react";

export const WithdrawBTCFeesDialog: FC<{
  arbiter?: ArbiterInfo; // TODO: mandatory?
  withdrawableTransactions: Transaction[];
  isOpen: boolean;
  onHandleClose: () => void;
  onContractUpdated: () => void;
}> = ({ arbiter, withdrawableTransactions, isOpen, onContractUpdated, onHandleClose, ...rest }) => {
  const { successToast } = useToasts();
  const [signedTransactions, setSignedTransactions] = useState<string[]>([]);
  const allInputsSigned = useMemo(() => signedTransactions.length === withdrawableTransactions.length, [signedTransactions, withdrawableTransactions]);

  const handleTransactionSigned = useCallback((transaction: Transaction) => {
    // A transaction in the list has been signed by the arbiter wallet.
    setSignedTransactions(prev => prev.concat(transaction.id));
  }, []);

  const publishWithdrawal = useCallback(() => {
    // All transactions (fee inputs) have been signed. We can publish the withdraw transaction to the bitcoin network.
    console.log("publishWithdrawal");
  }, []);

  if (!arbiter)
    return null;

  return (
    <Dialog {...rest} open={isOpen} onOpenChange={onHandleClose}>
      {/* Prevent focus for tooltip not to auto show */}
      <DialogContent aria-description="Withdraw BTC Fees" onOpenAutoFocus={e => e.preventDefault()}>
        {/* Header */}
        <DialogHeader>
          <DialogTitle>Withdraw BTC Fees</DialogTitle>
          <DialogDescription>
            Please sign the withdrawable BTC fees one by one then publish a single bitcoin transaction to get all those fees.
          </DialogDescription>
        </DialogHeader>

        {
          withdrawableTransactions.map(tx => (
            <WithdrawableTransactionRow key={tx.id} transaction={tx} onSigned={() => handleTransactionSigned(tx)} />
          ))
        }

        <DialogFooter>
          <Button disabled={!allInputsSigned} onClick={publishWithdrawal}>Publish to withdraw</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const WithdrawableTransactionRow: FC<{
  transaction: Transaction;
  onSigned: () => void;
}> = ({ transaction, onSigned }) => {

  const handleSignInput = useCallback(() => {
    // TODO: sign
    console.log("handleSignInput");

    onSigned();
  }, [onSigned]);

  return <div className="flex gap-4 items-center">
    <div className="flex gap-2 items-center">
      <div className="flex gap-2 items-center">
        {transaction.id}
        <Button onClick={handleSignInput}>Sign</Button>
        <div className="flex gap-1 items-center">
          <div className="flex gap-1 items-center">
            <CheckIcon className="h-4 w-4" />
            <span>Signed</span>
          </div>
        </div>
      </div>
    </div>
  </div>
}