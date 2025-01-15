import { EnsureWalletNetwork } from '@/components/base/EnsureWalletNetwork/EnsureWalletNetwork';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWalletContext } from '@/contexts/WalletContext/WalletContext';
import { useArbiter } from '@/services/arbiters/hooks/useArbiter';
import { rsSignatureToDer } from '@/services/btc/btc';
import { useBitcoinWalletAction } from '@/services/btc/hooks/useBitcoinWalletAction';
import { useTransaction } from '@/services/transactions/hooks/contract/useTransaction';
import { useTransactionSubmitArbitration } from '@/services/transactions/hooks/contract/useTransactionSubmitArbitration';
import { Transaction } from '@/services/transactions/model/transaction';
import { FC, useCallback, useState } from 'react';

export const SubmitSignatureDialog: FC<{
  transaction: Transaction;
  isOpen: boolean;
  onHandleClose: () => void;
}> = ({ transaction, isOpen, onHandleClose }) => {
  const { bitcoinAccount } = useWalletContext();
  const [isSigning, setIsSigning] = useState(false);
  const [signature, setSignature] = useState<string>(null);
  const { submitArbitration, isPending } = useTransactionSubmitArbitration();
  const { unsafeSignData } = useBitcoinWalletAction();
  const { fetchTransaction } = useTransaction(transaction?.id);
  const arbiter = useArbiter(transaction?.arbiter);
  const isRightOperatorBtcWallet = bitcoinAccount === arbiter?.operatorBtcAddress;

  const handleSignData = useCallback(async () => {
    setIsSigning(true);
    const contractTransaction = await fetchTransaction();
    console.log("Contract transaction:", contractTransaction)

    const _signature = await unsafeSignData(contractTransaction.btcTxHash);
    setSignature(_signature);

    setIsSigning(false);
  }, [unsafeSignData, fetchTransaction]);

  const handleSubmitSignature = useCallback(async () => {
    const derSignature = rsSignatureToDer(signature);
    console.log("DER signature:", derSignature);

    await submitArbitration(transaction.id, derSignature);
    onHandleClose();
    setSignature('');
  }, [onHandleClose, signature, submitArbitration, transaction]);

  return <Dialog open={isOpen} onOpenChange={onHandleClose}  >
    <DialogContent aria-description="Submit Arbitration">
      <DialogHeader>
        <DialogTitle>Submit Arbitration</DialogTitle>
      </DialogHeader>
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Please sign the following BTC transaction using your BTC wallet:
        </p>
        <div className="bg-gray-100 p-3 rounded break-all overflow-y-auto max-h-[200px]">
          {transaction?.btcTxHash}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          BTC Signature
        </label>
        <div className="bg-gray-100 p-3 rounded break-all overflow-y-auto max-h-[200px]">
          {signature ? signature : "-"}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="ghost" disabled={isPending} onClick={onHandleClose}>
          Cancel
        </Button>
        {
          signature &&
          <Button onClick={handleSubmitSignature} disabled={isPending || !signature}>
            Submit
          </Button>
        }
        {
          !signature &&
          <EnsureWalletNetwork continuesTo='Sign' btcAccountNeeded bitcoinSignDataNeeded>
            <Button onClick={handleSignData} disabled={isSigning || !isRightOperatorBtcWallet}>
              {isRightOperatorBtcWallet ? "Bitcoin sign" : "Wrong BTC wallet"}
            </Button>
          </EnsureWalletNetwork>
        }
      </div>
    </DialogContent>
  </Dialog>
}