import { BehaviorSubject } from "rxjs";

export type SignatureValidationRequest = {
  transactionId: string; // Transaction for which we sent the signature validation request
  requestId: string; // Request ID sent to the signature validation service
}

const SIGNATURE_VALIDATION_REQUESTS_STORAGE_KEY = "signature-validation-requests";
export const signatureValidationRequests = new BehaviorSubject<SignatureValidationRequest[]>([]);

const loadSignatureValidationRequests = () => {
  const rawRequests = localStorage.getItem(SIGNATURE_VALIDATION_REQUESTS_STORAGE_KEY);
  signatureValidationRequests.next(rawRequests ? JSON.parse(rawRequests) : []);
}

export const getSignatureValidationRequest = (transactionId: string): SignatureValidationRequest | undefined => {
  return signatureValidationRequests.value.find(o => o.transactionId?.toLowerCase() === transactionId?.toLowerCase());
}

/**
 * Locally remember a requested signature validation request (to the signature validation contract), 
 * so that we are able to check its status even after reloading the app.
 */
export const saveSignatureValidationRequest = (request: SignatureValidationRequest) => {
  signatureValidationRequests.next([
    ...signatureValidationRequests.value,
    {
      requestId: request.requestId,
      transactionId: request.transactionId
    }
  ]);

  localStorage.setItem(SIGNATURE_VALIDATION_REQUESTS_STORAGE_KEY, JSON.stringify(signatureValidationRequests.value));
}

loadSignatureValidationRequests();