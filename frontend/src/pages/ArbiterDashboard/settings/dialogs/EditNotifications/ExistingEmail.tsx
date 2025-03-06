import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { FC } from "react";

export const ExistingEmail: FC<{
  onWillingToUpdateEmail: () => void;
}> = ({ onWillingToUpdateEmail }) => {
  return <>
    <>An email address was already configured (hidden for privacy). Would you like to change it?</>
    <DialogFooter className="mt-6">
      <Button onClick={() => onWillingToUpdateEmail()}>
        Change email address
      </Button>
    </DialogFooter>
  </>
}