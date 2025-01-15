import { EnsureWalletNetwork } from "@/components/base/EnsureWalletNetwork/EnsureWalletNetwork";
import { IconTooltip } from "@/components/base/IconTooltip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { tooltips } from "@/config/tooltips";
import { useArbiterFeeRateUpdate } from "@/services/arbiters/hooks/contract/useArbiterFeeRateUpdate";
import { ArbiterInfo } from "@/services/arbiters/model/arbiter-info";
import { useResetFormOnOpen } from "@/services/ui/hooks/useResetFormOnOpen";
import { useToasts } from "@/services/ui/hooks/useToasts";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const EditFeeRateDialog: FC<{
  arbiter: ArbiterInfo;
  isOpen: boolean;
  onHandleClose: () => void;
  onContractUpdated: () => void;
}> = ({ arbiter, isOpen, onContractUpdated, onHandleClose, ...rest }) => {
  const { isPending, updateFeeRate } = useArbiterFeeRateUpdate();
  const { successToast } = useToasts();

  const formSchema = useMemo(() => z.object({
    feeRate: z.coerce.number().min(1).max(100),
  }), []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feeRate: arbiter.currentFeeRate / 100,
    },
  });

  // Reset default form values every time the dialog reopens
  useResetFormOnOpen(isOpen, form);

  const handlePublish = useCallback(async (values: z.infer<typeof formSchema>) => {
    if (await updateFeeRate(values.feeRate)) {
      successToast(`Arbiter fee rate successfully updated!`);

      // Update local model
      arbiter.currentFeeRate = values.feeRate * 100;

      onContractUpdated();
      onHandleClose();
    }
  }, [updateFeeRate, successToast, arbiter, onContractUpdated, onHandleClose]);

  if (!arbiter)
    return null;

  return (
    <Dialog {...rest} open={isOpen} onOpenChange={onHandleClose}>
      {/* Prevent focus for tooltip not to auto show */}
      <DialogContent aria-description="Edit arbiter Operator" onOpenAutoFocus={e => e.preventDefault()}>
        {/* Header */}
        <DialogHeader>
          <DialogTitle>Edit Arbiter Fee Rate</DialogTitle>
        </DialogHeader>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handlePublish)}>
            {/* Fee rate */}
            <FormField
              control={form.control}
              name="feeRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee rate (1-100%) <IconTooltip title="Fee rate" tooltip={tooltips.arbiterFeeRate} iconClassName='ml-1' iconSize={12} /></FormLabel>
                  <Input type='number' step="0.01" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <EnsureWalletNetwork continuesTo="Update" evmConnectedNeeded>
                <Button type="submit" className={!form.formState.isValid && "opacity-30"} disabled={isPending}>
                  Update
                </Button>
              </EnsureWalletNetwork>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}