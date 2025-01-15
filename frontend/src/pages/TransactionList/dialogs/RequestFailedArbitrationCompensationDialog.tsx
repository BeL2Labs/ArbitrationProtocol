import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useArbiterInfo } from '@/services/arbiters/hooks/contract/useArbiterInfo';
import { useBitcoinWalletAction } from '@/services/btc/hooks/useBitcoinWalletAction';
import { useCreateCompensationRequest } from '@/services/compensations/hooks/contract/useCreateCompensationRequest';
import { useSubmitSignatureValidation } from '@/services/signature-validation/hooks/contract/useSignatureValidationSubmit';
import { SignatureValidationRequest } from '@/services/signature-validation/storage';
import { useTransaction } from '@/services/transactions/hooks/contract/useTransaction';
import { Transaction } from '@/services/transactions/model/transaction';
import { getZKPRequest, saveZKPRequest } from '@/services/zkp/storage';
import { FC, useEffect, useMemo, useState } from 'react';
import { useCheckZkpStatus, ZKVerificationStatus } from '../hooks/useCheckZkpStatus';

export const RequestFailedArbitrationCompensationDialog: FC<{
  isOpen: boolean;
  transaction?: Transaction;
  onHandleClose: () => void;
}> = ({ transaction, isOpen, onHandleClose }) => {
  const { claimFailedArbitrationCompensation, isPending: isSubmittingCompensationRequest } = useCreateCompensationRequest();
  const [signatureVerificationRequest, setSignatureVerificationRequest] = useState<SignatureValidationRequest>(undefined); // Locally stored request we possibly already sent to the signature verification service for this transaction.
  const { submitSignatureValidation: submitSignatureVerification, isPending: isSubmittingZKPVerificationRequest } = useSubmitSignatureValidation();
  const { fetchArbiterInfo } = useArbiterInfo(transaction?.arbiter);
  const zkpVerificationStatus = useCheckZkpStatus(signatureVerificationRequest);
  const { unsafeSignData } = useBitcoinWalletAction();
  const { fetchTransaction } = useTransaction(transaction?.id); // Fetch from contract to get access to btcTxHash

  const handleRequestZKPVerification = async () => {
    const contractTransaction = await fetchTransaction();
    if (contractTransaction) {
      const arbiter = await fetchArbiterInfo();

      if (arbiter) {
        // Always the ARBITER operator pubkey
        const pubKey = arbiter.operatorBtcPubKey;
        // Message hash is transaction's btc tx hash
        const msgHash = transaction.btcTxHash;

        const signature = await unsafeSignData(msgHash);
        if (signature) {
          const requestId = await submitSignatureVerification(msgHash, 0, signature, pubKey);
          console.log("Signature verification request submitted with ID:", requestId);

          if (requestId) {
            const submittedRequest: SignatureValidationRequest = { transactionId: transaction.id, requestId };
            saveZKPRequest(submittedRequest);
            setSignatureVerificationRequest(submittedRequest);
          }
        }
      }
      else {
        console.error("ZKP verification request: failed to fetch arbiter");
      }
    }
    else {
      console.error("ZKP verification request: failed to fetch transaction from contract");
    }
  }

  useEffect(() => {
    if (isOpen)
      setSignatureVerificationRequest(getZKPRequest(transaction?.id));
    else
      setSignatureVerificationRequest(null);
  }, [transaction, isOpen]);

  const handleRequestCompensation = async () => {
    try {
      await claimFailedArbitrationCompensation(signatureVerificationRequest.requestId);
      onHandleClose();
    } catch (error) {
      console.error('Error requesting compensation:', error);
    }
  };

  const canSubmitVerificationRequest = useMemo(() => !signatureVerificationRequest, [signatureVerificationRequest]);
  const canSubmitCompensationRequest = useMemo(() => zkpVerificationStatus === ZKVerificationStatus.Verified, [zkpVerificationStatus]);

  useEffect(() => {
    if (isOpen)
      setSignatureVerificationRequest(getZKPRequest(transaction?.id));
    else
      setSignatureVerificationRequest(null);
  }, [transaction, isOpen]);

  return <Dialog open={isOpen} onOpenChange={onHandleClose}  >
    <DialogContent aria-description="Request compensation">
      <DialogHeader>
        <DialogTitle>Request compensation (Failed arbitration)</DialogTitle>
      </DialogHeader>

      <div>
        The arbitration request has been signed by the arbiter but you consider the arbiter has signed the wrong transaction. Please confirm you want to request compensation.
      </div>

      {
        /* ZK verification is needed, but has not been submitted yet */
        !signatureVerificationRequest &&
        <div>
          You're about to submit the bitcoin transaction for verification to the ZKP service.
          This will take a few minutes and once completed, you will be able to submit the verification
          proof to request the compensation.
        </div>
      }

      {
        /* ZK verification is needed, has been submitted, but verification is still in progress */
        signatureVerificationRequest && zkpVerificationStatus === ZKVerificationStatus.Verifying &&
        <div>
          Your transaction is still being verified, please hold on a few minutes. You will be able
          to submit the verification proof to request the compensation after that.
        </div>
      }

      {
        /* ZK verification is needed, and has been verified by the ZKP service */
        signatureVerificationRequest && zkpVerificationStatus === ZKVerificationStatus.Verified &&
        <div>
          Your transaction has been verified, you can now submit the verification proof to request the compensation.
        </div>
      }

      {
        /* ZK verification is needed, has been submitted, but failed for some reason */
        signatureVerificationRequest && zkpVerificationStatus === ZKVerificationStatus.Failed &&
        <div className='text-primary'>
          Unfortunately, your transaction failed verification for some reason, you cannot request compensation.
        </div>
      }

      {
        signatureVerificationRequest && zkpVerificationStatus === ZKVerificationStatus.Unknown &&
        <div>
          Checking ZKP verification status...
        </div>
      }

      <div className="flex justify-end space-x-4">
        <Button variant="ghost" disabled={isSubmittingCompensationRequest || isSubmittingZKPVerificationRequest} onClick={onHandleClose}>
          Cancel
        </Button>
        {
          canSubmitVerificationRequest &&
          <Button onClick={handleRequestZKPVerification} disabled={isSubmittingZKPVerificationRequest || !canSubmitVerificationRequest}>
            Request verification
          </Button>
        }
        {
          canSubmitCompensationRequest &&
          <Button onClick={handleRequestCompensation} disabled={isSubmittingCompensationRequest || !canSubmitCompensationRequest}>
            Submit
          </Button>
        }
      </div>
    </DialogContent>
  </Dialog>
}