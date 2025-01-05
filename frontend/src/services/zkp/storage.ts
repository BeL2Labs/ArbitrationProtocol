import { BehaviorSubject } from "rxjs";

export type ZKPRequestTarget = "borrower-borrow" | "lender-unlock" | "lender-time-unlock";

type ZKPRequest = {
  transactionId: string // Transaction for which we sent the ZKP request
  requestId: string; // Request ID sent to the ZKP service
}

const ZKP_REQUESTS_STORAGE_KEY = "zkp-requests";
export let zkpRequests = new BehaviorSubject<ZKPRequest[] | undefined>(undefined);

const loadZKPRequests = () => {
  const rawRequests = localStorage.getItem(ZKP_REQUESTS_STORAGE_KEY);
  zkpRequests.next(rawRequests ? JSON.parse(rawRequests) : []);
}

export const getZKPRequest = (transactionId: string): ZKPRequest | undefined => {
  return zkpRequests.value.find(o => o.transactionId?.toLowerCase() === transactionId?.toLowerCase());
}

/**
 * Locally remember a paid zkp request, so that we are able to check
 * its status even after reloading the app.
 * 
 * @param target should be borrow the for initial payment from the borrower to the unlock script, and repay when the lender confirms the loan has been returned.
 */
export const saveZKPRequest = (request: ZKPRequest) => {
  zkpRequests.next([
    ...zkpRequests.value,
    {
      requestId: request.requestId,
      transactionId: request.transactionId
    }
  ]);

  localStorage.setItem(ZKP_REQUESTS_STORAGE_KEY, JSON.stringify(zkpRequests.value))
}

loadZKPRequests();