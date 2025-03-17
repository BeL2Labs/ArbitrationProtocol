import { FeeRateType, FeeRateTypePicker } from "@/components/arbiters/FeeRateTypePicker";
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
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const EditFeeRateDialog: FC<{
  arbiter: ArbiterInfo;
  isOpen: boolean;
  onHandleClose: () => void;
  onContractUpdated: () => void;
}> = ({ arbiter, isOpen, onContractUpdated, onHandleClose, ...rest }) => {
  const { isPending, setFeeRates } = useArbiterFeeRateUpdate();
  const { successToast } = useToasts();
  const [feeRateType, setFeeRateType] = useState<FeeRateType>("btc");

  const formSchema = useMemo(() => z.object({
    feeRate: z.coerce.number().min(0).max(100),
    btcFeeRate: z.coerce.number().min(0).max(100),
  }), []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      feeRate: arbiter.currentFeeRate / 100 || 0,
      btcFeeRate: arbiter.currentBTCFeeRate / 100 || 0
    },
  });

  // Reset default form values every time the dialog reopens
  useResetFormOnOpen(isOpen, form);

  const handlePublish = useCallback(async (values: z.infer<typeof formSchema>) => {
    const newElaFeeRate = feeRateType === "ela" ? values.feeRate : 0;
    const newBtcFeeRate = feeRateType === "btc" ? values.btcFeeRate : 0;
    if (await setFeeRates(newElaFeeRate, newBtcFeeRate)) {
      successToast(`Arbiter fee rate successfully updated!`);

      // Update local model - and reset the rate type that becomes unused
      arbiter.currentFeeRate = newElaFeeRate;
      arbiter.currentBTCFeeRate = newBtcFeeRate;

      onContractUpdated();
      onHandleClose();
    }
  }, [feeRateType, setFeeRates, successToast, arbiter, onContractUpdated, onHandleClose]);

  useEffect(() => {
    // Auto-detect current fee rate type when dialog opens.
    if (arbiter && isOpen)
      setFeeRateType(arbiter.currentFeeRate > 0 ? "ela" : "btc");
  }, [arbiter, isOpen]);

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
            {/* Fee rate selection */}
            <FormItem>
              <FormLabel>Fee rate</FormLabel>
              <FeeRateTypePicker value={feeRateType} onChange={setFeeRateType} />
            </FormItem>

            {/* ELA Fee rate */}
            {feeRateType === "ela" &&
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
            }

            {/* BTC Fee rate */}
            {feeRateType === "btc" &&
              <FormField
                control={form.control}
                name="btcFeeRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BTC Fee rate (1-100%)</FormLabel>
                    <Input type='number' step="0.01" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            }

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