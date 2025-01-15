import { EnsureWalletNetwork } from "@/components/base/EnsureWalletNetwork/EnsureWalletNetwork";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useWalletContext } from "@/contexts/WalletContext/WalletContext";
import { useArbiterOperatorUpdate } from "@/services/arbiters/hooks/contract/useArbiterOperatorUpdate";
import { ArbiterInfo } from "@/services/arbiters/model/arbiter-info";
import { isValidBitcoinAddress, isValidBitcoinPublicKey } from "@/services/btc/btc";
import { useBitcoinWalletAction } from "@/services/btc/hooks/useBitcoinWalletAction";
import { useResetFormOnOpen } from "@/services/ui/hooks/useResetFormOnOpen";
import { useToasts } from "@/services/ui/hooks/useToasts";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { isAddress } from "viem";
import { z } from "zod";

export const EditOperatorDialog: FC<{
  arbiter: ArbiterInfo;
  isOpen: boolean;
  onHandleClose: () => void;
  onContractUpdated: () => void;
}> = ({ arbiter, isOpen, onContractUpdated, onHandleClose, ...rest }) => {
  const { isPending, updateOperatorInfo } = useArbiterOperatorUpdate();
  const { successToast } = useToasts();
  const { bitcoinAccount } = useWalletContext();
  const { getPublicKey } = useBitcoinWalletAction();

  const formSchema = useMemo(() => z.object({
    operatorEVMAddress: z.string().refine((value) => isAddress(value), "Not a valid EVM address"),
    operatorBTCAddress: z.string().refine(isValidBitcoinAddress, "Not a valid Bitcoin address"),
    operatorBTCPubKey: z.string().refine(isValidBitcoinPublicKey, "Not a valid Bitcoin public key"),
  }), []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      operatorEVMAddress: arbiter?.operatorEvmAddress as any || '',
      operatorBTCAddress: arbiter?.operatorBtcAddress || '',
      operatorBTCPubKey: arbiter?.operatorBtcPubKey || '',
    },
  });

  // Reset default form values every time the dialog reopens
  useResetFormOnOpen(isOpen, form);

  const handlePublish = useCallback(async (values: z.infer<typeof formSchema>) => {
    if (await updateOperatorInfo(values.operatorEVMAddress, values.operatorBTCAddress, values.operatorBTCPubKey)) {
      successToast(`Operator information successfully updated!`);

      // Update local model
      arbiter.operatorEvmAddress = values.operatorEVMAddress;
      arbiter.operatorBtcAddress = values.operatorBTCAddress;
      arbiter.operatorBtcPubKey = values.operatorBTCPubKey;

      onContractUpdated();
      onHandleClose();
    }
  }, [updateOperatorInfo, successToast, arbiter, onContractUpdated, onHandleClose]);

  const handleImportOperatorFromWallet = useCallback(async () => {
    const pubKey = await getPublicKey();

    form.setValue("operatorBTCAddress", bitcoinAccount);
    form.setValue("operatorBTCPubKey", pubKey);

    // Revalidate the form
    void form.trigger();
  }, [bitcoinAccount, getPublicKey, form]);

  if (!arbiter)
    return null;

  return (
    <Dialog {...rest} open={isOpen} onOpenChange={onHandleClose}>
      <DialogContent aria-description="Edit arbiter Operator">
        {/* Header */}
        <DialogHeader>
          <DialogTitle>Edit Arbiter Operator</DialogTitle>
          <DialogDescription>The operator is the entity who manages arbiter operations. It's possibly not the creator.</DialogDescription>
        </DialogHeader>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handlePublish)}>
            {/* Operator EVM Address */}
            <FormField control={form.control} name="operatorEVMAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operator EVM Address</FormLabel>
                  <Input type='text' {...field} />
                  <FormMessage />
                </FormItem>
              )} />

            {/* Operator BTC Address */}
            <FormField control={form.control} name="operatorBTCAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operator BTC Address</FormLabel>
                  <Input type='text' {...field} />
                  <FormMessage />
                </FormItem>
              )} />

            {/* Operator BTC Public Key */}
            <FormField control={form.control} name="operatorBTCPubKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operator BTC Public Key</FormLabel>
                  <Input type='text' {...field} />
                  <FormMessage />
                </FormItem>
              )} />

            <DialogFooter className="mt-6">
              <EnsureWalletNetwork continuesTo='Import from wallet' btcAccountNeeded>
                <Button type="button" onClick={handleImportOperatorFromWallet}>Import from wallet</Button>
              </EnsureWalletNetwork>
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