import { useSignatureValidationStatus } from "@/services/signature-validation/hooks/contract/useSignatureValidationStatus";
import { SignatureValidationRequest } from "@/services/signature-validation/storage";
import { useCallback, useEffect, useState } from "react";
import { useInterval } from "usehooks-ts";

export enum SignatureValidationStatus {
  Unknown,
  Verifying,
  Failed,
  Verified
}

export const useCheckSignatureValidationStatus = (signatureValidationRequest: SignatureValidationRequest) => {
  const { fetchSignatureValidationStatus } = useSignatureValidationStatus();
  const [signatureValidationStatus, setSignatureValidationStatus] = useState<SignatureValidationStatus>(SignatureValidationStatus.Unknown);

  const checkZkpStatus = useCallback(async () => {
    if (!signatureValidationRequest) {
      setSignatureValidationStatus(SignatureValidationStatus.Unknown);
      return;
    }

    if (signatureValidationStatus === SignatureValidationStatus.Verified || signatureValidationStatus === SignatureValidationStatus.Failed)
      return;

    const contractStatus = await fetchSignatureValidationStatus(signatureValidationRequest.requestId);
    console.log("Signature validation contractStatus:", contractStatus);

    if (!contractStatus)
      return;

    /**
     * - mshHash null = verifying
     * - msgHash not null && ?verified -> verified or failed
     */
    const isMsgHashNull = contractStatus.msghash === "0x";
    if (isMsgHashNull)
      setSignatureValidationStatus(SignatureValidationStatus.Verifying);
    else if (contractStatus.verified)
      setSignatureValidationStatus(SignatureValidationStatus.Verified);
    else if (!contractStatus.verified)
      setSignatureValidationStatus(SignatureValidationStatus.Failed);
    else
      setSignatureValidationStatus(SignatureValidationStatus.Unknown);
  }, [signatureValidationRequest, signatureValidationStatus, fetchSignatureValidationStatus]);

  // Regularly get the latest ZKP status if needed.
  useInterval(() => {
    void checkZkpStatus();
  }, 5000);

  useEffect(() => {
    if (!signatureValidationRequest)
      setSignatureValidationStatus(SignatureValidationStatus.Unknown);
  }, [signatureValidationRequest]);

  return signatureValidationStatus;
}