import { IconTooltip } from '@/components/base/IconTooltip';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useArbiterInfo } from '@/services/arbiters/hooks/contract/useArbiterInfo';
import { isValidBtcTransactionHash } from '@/services/btc/btc';
import { useCreateCompensationRequest } from '@/services/compensations/hooks/contract/useCreateCompensationRequest';
import { getTransactionDetails } from '@/services/nownodes-api/nownodes-api';
import { Transaction } from '@/services/transactions/model/transaction';
import { useZKPSubmitVerificationRequest } from '@/services/zkp/hooks/contract/useZKPSubmitVerificationRequest';
import { getZKPRequest, saveZKPRequest, ZKPRequest } from '@/services/zkp/storage';
import { getParamsForZKPRequest } from '@/services/zkp/zkp.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { FC, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useCheckZkpStatus, ZKVerificationStatus } from '../hooks/useCheckZkpStatus';

export const RequestIllegalSignatureCompensationDialog: FC<{
  isOpen: boolean;
  transaction?: Transaction;
  onHandleClose: () => void;
}> = ({ transaction, isOpen, onHandleClose }) => {
  const { claimIllegalSignatureCompensation, isPending: isSubmittingCompensationRequest } = useCreateCompensationRequest();
  const [zkpRequest, setZkpRequest] = useState<ZKPRequest>(undefined); // Locally stored request we possibly already sent to the ZKP service for this transaction.
  const { submitVerificationRequest, isPending: isSubmittingZKPVerificationRequest } = useZKPSubmitVerificationRequest();
  const { fetchArbiterInfo } = useArbiterInfo(transaction?.arbiter);
  const [isFetchingZKPParams, setIsFetchingZKPParams] = useState(false);
  const zkpVerificationStatus = useCheckZkpStatus(zkpRequest);

  const formSchema = useMemo(() => z.object({
    btcTxHash: z.string().refine((value) => isValidBtcTransactionHash(value), "Invalid Bitcoin transaction hash")
  }), []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      btcTxHash: "",
    },
  });

  const handleRequestZKPVerification = async (values: z.infer<typeof formSchema>) => {
    setIsFetchingZKPParams(true);

    const btcTxId = values.btcTxHash;
    const bitcoinTransaction = await getTransactionDetails(btcTxId);
    if (bitcoinTransaction) {
      const zkpRequestParams = await getParamsForZKPRequest(bitcoinTransaction.hex);
      const arbiter = await fetchArbiterInfo();

      if (zkpRequestParams && arbiter) {
        const inputIndex = 0; // TODO - find the right index according to zehua's method. Could be non 0 in case of malicious tx.

        // pubKey is always the ARBITER operator pubkey
        const requestId = await submitVerificationRequest(arbiter.operatorBtcPubKey, bitcoinTransaction.hex, zkpRequestParams.utxos, inputIndex, 0);
        console.log("ZKP verification request submitted with ID:", requestId);

        if (requestId) {
          const submittedRequest: ZKPRequest = { transactionId: transaction.id, requestId };
          saveZKPRequest(submittedRequest);
          setZkpRequest(submittedRequest);
        }
      }
      else {
        console.error("ZKP verification request: failed to fetch arbiter");
      }
    }
    else {
      console.error("ZKP verification request: failed to find bitcoin transaction from hash");
    }

    setIsFetchingZKPParams(false);
  }

  const handleRequestCompensation = async () => {
    try {
      await claimIllegalSignatureCompensation(transaction.arbiter, zkpRequest.requestId);
      onHandleClose();
    } catch (error) {
      console.error('Error requesting compensation:', error);
    }
  };

  const canSubmitZKVerificationRequest = useMemo(() => !zkpRequest, [zkpRequest]);
  const canSubmitCompensationRequest = useMemo(() => zkpVerificationStatus === ZKVerificationStatus.Verified, [zkpVerificationStatus]);

  useEffect(() => {
    if (isOpen)
      setZkpRequest(getZKPRequest(transaction?.id));
    else
      setZkpRequest(null);
  }, [transaction, isOpen]);

  return <Dialog open={isOpen} onOpenChange={onHandleClose}  >
    <DialogContent aria-description="Request compensation">
      <DialogHeader>
        <DialogTitle>Request compensation (Illegal signature)</DialogTitle>
      </DialogHeader>

      <div>
        No arbitration has been requested, but if you think <b>the arbiter has submitted a bitcoin transaction when it shouldn't have</b>, you can provide the faulty bitcoin transaction ID and the ZKP service will check it.
      </div>

      {
        /* ZK verification is needed, but has not been submitted yet */
        !zkpRequest &&
        <div>
          You're about to submit the bitcoin transaction for verification to the ZKP service.
          This will take a few minutes and once completed, you will be able to submit the verification
          proof to request the compensation.
        </div>
      }

      {
        /* ZK verification is needed, has been submitted, but verification is still in progress */
        zkpRequest && zkpVerificationStatus === ZKVerificationStatus.Verifying &&
        <div>
          Your transaction is still being verified, please hold on a few minutes. You will be able
          to submit the verification proof to request the compensation after that.
        </div>
      }

      {
        /* ZK verification is needed, and has been verified by the ZKP service */
        zkpRequest && zkpVerificationStatus === ZKVerificationStatus.Verified &&
        <div>
          Your transaction has been verified, you can now submit the verification proof to request the compensation.
        </div>
      }

      {
        /* ZK verification is needed, has been submitted, but failed for some reason */
        zkpRequest && zkpVerificationStatus === ZKVerificationStatus.Failed &&
        <div className='text-primary'>
          Unfortunately, your transaction failed verification for some reason, you cannot request compensation.
        </div>
      }

      {
        zkpRequest && zkpVerificationStatus === ZKVerificationStatus.Unknown &&
        <div>
          Checking ZKP verification status...
        </div>
      }

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleRequestZKPVerification)}>
          {/* BTC tx hash */}
          {canSubmitZKVerificationRequest && <FormField
            control={form.control}
            name="btcTxHash"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bitcoin transaction ID <IconTooltip title="Bitcoin transaction ID" tooltip="Transaction hash of the transaction you think was illegally submitted by the arbiter." iconClassName='ml-1' iconSize={12} /></FormLabel>
                <Input {...field} />
                <FormMessage />
              </FormItem>
            )}
          />
          }

          <DialogFooter>
            <div className="flex justify-end space-x-4 mt-4">
              <Button type="button" variant="ghost" disabled={isSubmittingCompensationRequest || isSubmittingZKPVerificationRequest} onClick={onHandleClose}>
                Cancel
              </Button>
              {
                canSubmitZKVerificationRequest &&
                <Button type="submit" disabled={isFetchingZKPParams || isSubmittingZKPVerificationRequest || !canSubmitZKVerificationRequest || !form.formState.isValid}>
                  Request verification
                </Button>
              }
              {
                canSubmitCompensationRequest &&
                <Button type="button" onClick={handleRequestCompensation} disabled={isSubmittingCompensationRequest || !canSubmitCompensationRequest}>
                  Submit
                </Button>
              }
            </div>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  </Dialog>
}