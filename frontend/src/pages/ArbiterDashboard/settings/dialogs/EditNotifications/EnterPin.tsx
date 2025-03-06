import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useBackendArbiter } from "@/services/arbiter-backend/hooks/useBackendArbiter";
import { ArbiterInfo } from "@/services/arbiters/model/arbiter-info";
import { useToasts } from "@/services/ui/hooks/useToasts";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const EnterPin: FC<{
  arbiter: ArbiterInfo;
  onPinCodeVerified: () => void;
}> = ({ arbiter, onPinCodeVerified }) => {
  const { successToast, errorToast } = useToasts();
  const { sendEmailVerificationPinCode } = useBackendArbiter(arbiter.address);

  const formSchema = useMemo(() => z.object({
    pinCode: z.string().min(4).max(4),
  }), []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pinCode: ""
    },
  });

  const handleSubmitPinCode = useCallback(async (values: z.infer<typeof formSchema>) => {
    if (await sendEmailVerificationPinCode(values.pinCode)) {
      successToast("Address email updated");
      onPinCodeVerified();
    }
    else
      errorToast("Invalid PIN code");
  }, [errorToast, onPinCodeVerified, sendEmailVerificationPinCode, successToast]);

  return <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmitPinCode)}>
        {/* Email address */}
        <FormField
          control={form.control}
          name="pinCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PIN code</FormLabel>
              <Input type='string' {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="mt-6">
          <Button type="submit">
            Submit PIN code
          </Button>
        </DialogFooter>
      </form>
    </Form>
  </>
}