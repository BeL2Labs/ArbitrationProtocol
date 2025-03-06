import { EnsureWalletNetwork } from "@/components/base/EnsureWalletNetwork/EnsureWalletNetwork";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useBackendArbiter } from "@/services/arbiter-backend/hooks/useBackendArbiter";
import { ArbiterInfo } from "@/services/arbiters/model/arbiter-info";
import { useSignTypedData } from "@/services/evm/hooks/useSignTypedData";
import { useToasts } from "@/services/ui/hooks/useToasts";
import { isValidEmailAddress } from "@/utils/isValidEmailAddress";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const EnterEmail: FC<{
  arbiter: ArbiterInfo;
  onEmailUpdateRequestSent: () => void;
}> = ({ arbiter, onEmailUpdateRequestSent }) => {
  const { successToast, errorToast } = useToasts();
  const [isSigningEvmChallenge, setIsSigningEvmChallenge] = useState(false);
  const { requestTypedDataSignature } = useSignTypedData();
  const { upsertBackendArbiter, isPosting } = useBackendArbiter(arbiter.address);

  const formSchema = useMemo(() => z.object({
    email: z.string().refine(isValidEmailAddress, "A valid email address is required"),
  }), []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: ""
    },
  });

  const handleUpdate = useCallback(async (values: z.infer<typeof formSchema>) => {
    setIsSigningEvmChallenge(true);
    const { payload, signature } = (await requestTypedDataSignature()) || {};
    setIsSigningEvmChallenge(false);

    if (!signature)
      return;

    if (await upsertBackendArbiter(values.email, payload, signature)) {
      onEmailUpdateRequestSent();
    }
    else
      errorToast("Failed to update email address");
  }, [requestTypedDataSignature, upsertBackendArbiter, errorToast, onEmailUpdateRequestSent]);

  return <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleUpdate)}>
        {/* Email address */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <Input type='email' {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="mt-6">
          <EnsureWalletNetwork continuesTo="Update" evmConnectedNeeded>
            <Button disabled={isSigningEvmChallenge || isPosting} type="submit" className={!form.formState.isValid && "opacity-30"}>
              Update
            </Button>
          </EnsureWalletNetwork>
        </DialogFooter>
      </form>
    </Form>
  </>
}