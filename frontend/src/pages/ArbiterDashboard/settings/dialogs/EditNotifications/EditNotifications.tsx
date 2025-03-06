import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBackendArbiter } from "@/services/arbiter-backend/hooks/useBackendArbiter";
import { ArbiterInfo } from "@/services/arbiters/model/arbiter-info";
import { FC, useEffect, useMemo, useState } from "react";
import { Checking } from "./Checking";
import { EnterEmail } from "./EnterEmail";
import { EnterPin } from "./EnterPin";
import { ExistingEmail } from "./ExistingEmail";

export type EditNotificationsStep = "checking" | "existing-email" | "enter-email" | "enter-pin";

export const EditNotificationsDialog: FC<{
  arbiter: ArbiterInfo;
  isOpen: boolean;
  onHandleClose: () => void;
  onContractUpdated: () => void;
}> = ({ arbiter, isOpen, onContractUpdated, onHandleClose, ...rest }) => {
  const { status: backendArbiterStatus, isFetchingStatus } = useBackendArbiter(arbiter.address);
  const emailAddressAlreadySet = useMemo(() => backendArbiterStatus?.emailKnown, [backendArbiterStatus]);
  const [willingToUpdateEmail, setWillingToUpdateEmail] = useState(false);
  const [emailUpdateRequestSent, setEmailUpdateRequestSent] = useState(false);

  useEffect(() => {
    // Reset state on open
    if (isOpen) {
      setWillingToUpdateEmail(false);
      setEmailUpdateRequestSent(false);
      setWillingToUpdateEmail(false);
    }
  }, [isOpen]);

  const step: EditNotificationsStep = useMemo(() => {
    if (!backendArbiterStatus || isFetchingStatus)
      return "checking";
    else {
      if (emailUpdateRequestSent)
        return "enter-pin";
      else {
        if (!emailAddressAlreadySet || willingToUpdateEmail)
          return "enter-email";
        else
          return "existing-email"
      }
    }
  }, [backendArbiterStatus, emailAddressAlreadySet, emailUpdateRequestSent, isFetchingStatus, willingToUpdateEmail]);

  if (!arbiter)
    return null;

  return (
    <Dialog {...rest} open={isOpen} onOpenChange={onHandleClose}>
      {/* Prevent focus for tooltip not to auto show */}
      <DialogContent aria-description="Edit arbiter Operator" onOpenAutoFocus={e => e.preventDefault()}>
        {/* Header */}
        <DialogHeader>
          <DialogTitle>Edit Notifications</DialogTitle>
          <DialogDescription>
            Provide your email address to receive arbitration request notifications by email every time
            your arbiter get some work to do. You will have to verify your EVM wallet with a simple signature,
            and your email address with a simple PIN code.
          </DialogDescription>
        </DialogHeader>

        {step === "checking" && <Checking />}
        {step === "existing-email" && <ExistingEmail onWillingToUpdateEmail={() => setWillingToUpdateEmail(true)} />}
        {step === "enter-email" && <EnterEmail arbiter={arbiter} onEmailUpdateRequestSent={() => setEmailUpdateRequestSent(true)} />}
        {step === "enter-pin" && <EnterPin arbiter={arbiter} onPinCodeVerified={() => onHandleClose()} />}
      </DialogContent>
    </Dialog>
  )
}