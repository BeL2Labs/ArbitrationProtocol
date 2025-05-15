import { EnsureWalletNetwork } from '@/components/base/EnsureWalletNetwork/EnsureWalletNetwork';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ArbiterInfo } from '@/services/arbiters/model/arbiter-info';
import { btcToSats, rsSignatureToDer } from '@/services/btc/btc';
import { useBitcoinPublicKey } from '@/services/btc/hooks/useBitcoinPublicKey';
import { useBitcoinWalletAction } from '@/services/btc/hooks/useBitcoinWalletAction';
import { estimateBTCFeeRate } from '@/services/mempool-api/mempool-api';
import { UTXO } from '@/services/nownodes-api/model/types';
import { publishBitcoinTransaction } from '@/services/nownodes-api/nownodes-api';
import { TransactionBTCFeeInfo } from '@/services/transactions/hooks/useBTCFees';
import { Transaction } from '@/services/transactions/model/transaction';
import {
  BTCFeeWithdrawlTxCreationInputs,
  generateBtcFeeScript,
  generateRawTransactionForBTCFeeWithdrawal,
  markTransactionBTCFeesWithdrawn
} from '@/services/transactions/transaction-btc-fees.service';
import { useToasts } from '@/services/ui/hooks/useToasts';
import { formatAddress } from '@/utils/formatAddress';
import { Transaction as BTCTransaction } from 'bitcoinjs-lib';
import { CheckIcon } from 'lucide-react';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

/**
 * State of a transaction, either signed or not yet.
 */
type TransactionSignatureInProgress = {
  transaction: Transaction;
  utxo: UTXO;
  script: Buffer;

  signature?: string;
};

export const WithdrawBTCFeesDialog: FC<{
  arbiter: ArbiterInfo;
  withdrawableTransactions: Transaction[];
  btcFeesInfo: Record<string, TransactionBTCFeeInfo>;
  isOpen: boolean;
  onHandleClose: () => void;
  onTransactionSubmitted: () => void;
}> = ({ arbiter, btcFeesInfo, withdrawableTransactions, isOpen, onHandleClose, onTransactionSubmitted, ...rest }) => {
  const { successToast } = useToasts();
  const [transactionsInProgress, setTransactionsInProgress] = useState<TransactionSignatureInProgress[]>([]);
  const [allInputsSigned, setAllInputsSigned] = useState<boolean>(false);
  const currentPublicKey = useBitcoinPublicKey(); // Bitcoin public key of currently active wallet
  const isSameBitcoinPublicKey = useMemo(
    () => arbiter.revenueBtcPubKey === currentPublicKey,
    [arbiter, currentPublicKey]
  );
  const [publishingTx, setPublishingTx] = useState<boolean>(false);

  // Important: The order of elements in the inputs during signature and publication cannot be changed.
  const handleTransactionSigned = useCallback(
    (signResult: TransactionSignatureInProgress) => {
      // A transaction in the list has been signed by the arbiter wallet.
      const workedTransaction = transactionsInProgress.find(t => t.transaction.id === signResult.transaction.id);
      workedTransaction.signature = signResult.signature;

      setAllInputsSigned(transactionsInProgress.every(t => !!t.signature));
    },
    [transactionsInProgress]
  );

  const publishWithdrawal = useCallback(async () => {
    setPublishingTx(true);

    // All transactions (fee inputs) have been signed. We can publish the withdraw transaction to the bitcoin network.
    const inputs: BTCFeeWithdrawlTxCreationInputs = {
      outputPubKey: arbiter.revenueBtcPubKey,
      outputBtcAddress: arbiter.revenueBtcAddress,
      satsPerVb: await estimateBTCFeeRate(),
      inputs: transactionsInProgress.map(info => ({
        utxo: info.utxo,
        script: info.script,
        signature: info.signature
      }))
    };

    // Build the real transaction, using the right output value
    const btcTxWithAllWitnesses = generateRawTransactionForBTCFeeWithdrawal(inputs, true);
    console.log('btcTxWithAllWitnesses', btcTxWithAllWitnesses.toHex());

    // Broadcast the transaction
    const btcTxId = await publishBitcoinTransaction(btcTxWithAllWitnesses.toHex());
    if (btcTxId) {
      // If transaction publishing was successful, mark all transactions as processed
      transactionsInProgress.forEach(t => markTransactionBTCFeesWithdrawn(t.transaction.id));
      successToast('Transaction published, wait for bitcoin chain confirmation');
    }

    setPublishingTx(false);
    onHandleClose();
    onTransactionSubmitted();
  }, [arbiter, transactionsInProgress, successToast, onHandleClose, onTransactionSubmitted]);

  useEffect(() => {
    if (!isOpen) {
      // When reopening the dialog, reset all previous state
      setTransactionsInProgress(withdrawableTransactions?.map(wt => ({
        transaction: wt,
        script: generateBtcFeeScript(arbiter.revenueBtcPubKey, wt),
        utxo: btcFeesInfo[wt.id].utxo
      })));
      setAllInputsSigned(false);
    }
  }, [arbiter.revenueBtcPubKey, btcFeesInfo, isOpen, withdrawableTransactions]);

  useEffect(() => {
    // When the initial array of transactions to work on changes, we rebuild of transactions in progress list
    setTransactionsInProgress(
      withdrawableTransactions?.map(wt => ({
        transaction: wt,
        script: generateBtcFeeScript(arbiter.revenueBtcPubKey, wt),
        utxo: btcFeesInfo[wt.id].utxo
      }))
    );
  }, [arbiter, btcFeesInfo, withdrawableTransactions]);

  if (!arbiter || !btcFeesInfo || !isOpen) return null;

  // if (Object.values(btcFeesInfo).length != withdrawableTransactions.length)
  //   throw new Error("btcFeesInfo and withdrawableTransactions should have the same length");

  return (
    <Dialog {...rest} open={isOpen} onOpenChange={onHandleClose}>
      {/* Prevent focus for tooltip not to auto show */}
      <DialogContent aria-description='Withdraw BTC Fees' onOpenAutoFocus={e => e.preventDefault()}>
        {/* Header */}
        <DialogHeader>
          <DialogTitle>Withdraw BTC Fees</DialogTitle>
          <DialogDescription>
            Please sign the withdrawable BTC fees one by one then publish a single bitcoin transaction to get all those
            fees.
          </DialogDescription>
        </DialogHeader>

        {withdrawableTransactions.map(tx => (
          <WithdrawableTransactionRow
            key={tx.id}
            arbiter={arbiter}
            transaction={tx}
            transactionsInProgress={transactionsInProgress}
            onSigned={handleTransactionSigned}
          />
        ))}

        <DialogFooter className='sm:justify-center'>
          <EnsureWalletNetwork continuesTo='Publish transaction' btcAccountNeeded bitcoinSignDataNeeded>
            <Button disabled={!allInputsSigned || !isSameBitcoinPublicKey || publishingTx} onClick={publishWithdrawal}>
              {isSameBitcoinPublicKey ? 'Publish to withdraw' : 'Wrong bitcoin address'}
            </Button>
          </EnsureWalletNetwork>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const WithdrawableTransactionRow: FC<{
  arbiter: ArbiterInfo;
  transaction: Transaction;
  transactionsInProgress: TransactionSignatureInProgress[];
  onSigned: (transactionsInProgress: TransactionSignatureInProgress) => void;
}> = ({ transaction, transactionsInProgress, arbiter, onSigned }) => {
  const { errorToast } = useToasts();
  const { unsafeSignData } = useBitcoinWalletAction();
  const transactionInProgress = useMemo(
    () => transactionsInProgress.find(t => t.transaction.id === transaction.id),
    [transactionsInProgress, transaction]
  );
  const [isSigned, setIsSigned] = useState<boolean>(false);
  const currentPublicKey = useBitcoinPublicKey(); // Bitcoin public key of currently active wallet
  const isSameBitcoinPublicKey = useMemo(
    () => arbiter.revenueBtcPubKey === currentPublicKey,
    [arbiter, currentPublicKey]
  );

  const handleSignInput = useCallback(async () => {
    console.log('Starting to sign bel2 transaction as input for the btc fee withdraw transaction');

    if (!transactionInProgress) {
      console.log('Transactions in progress:', transactionInProgress);
      throw new Error(`Transaction to sign was not found in the list of transactions in progress, whats going on?`);
    }

    try {
      const inputs: BTCFeeWithdrawlTxCreationInputs = {
        outputPubKey: arbiter.revenueBtcPubKey,
        outputBtcAddress: arbiter.revenueBtcAddress,
        satsPerVb: await estimateBTCFeeRate(),
        inputs: transactionsInProgress.map(info => ({
          utxo: info.utxo,
          script: info.script
        }))
      };

      // Build the real transaction, using the right output value
      const rawBtcTx = generateRawTransactionForBTCFeeWithdrawal(inputs, false);
      const index = inputs.inputs.findIndex( (i => i.utxo.txid === transactionInProgress.utxo.txid))
      const feeSatsValue = btcToSats(transaction.arbitratorFeeBTC).toNumber();
      const hashForWitness = rawBtcTx
        .hashForWitnessV0(index, transactionInProgress.script, feeSatsValue, BTCTransaction.SIGHASH_ALL)
        .toString('hex');
      const signature = await unsafeSignData(hashForWitness);

      const derSignature = rsSignatureToDer(signature);

      console.log('HashForWitness:', hashForWitness);
      console.log('Signature:', signature);
      console.log('DerSignature:', derSignature);

      if (derSignature) {
        setIsSigned(true); // Use a state here, not a memo, as signature contained in transactions in progress array is not dynamic

        onSigned({
          signature: derSignature,
          utxo: transactionInProgress.utxo,
          script: transactionInProgress.script,
          transaction: transaction
        });
      }
    } catch (e) {
      errorToast(e.message || `${e}`);
    }
  }, [arbiter, onSigned, transactionsInProgress, transactionInProgress, transaction, unsafeSignData, errorToast]);

  return (
    <div className='flex gap-4 items-center w-full'>
      <Table className='w-full'>
        <TableBody>
          <TableRow>
            <TableCell>
              Transaction <b>{formatAddress(transaction.id)}</b>
            </TableCell>
            <TableCell className='flex flex-row justify-end'>
              {!isSigned && (
                <EnsureWalletNetwork continuesTo='Sign' btcAccountNeeded bitcoinSignDataNeeded>
                  <Button disabled={!isSameBitcoinPublicKey} onClick={handleSignInput}>
                    {isSameBitcoinPublicKey ? 'Sign' : 'Wrong bitcoin address'}
                  </Button>
                </EnsureWalletNetwork>
              )}
              {isSigned && (
                <div className='flex gap-1 items-center'>
                  <CheckIcon className='h-4 w-4' />
                  <span>Signed</span>
                </div>
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
