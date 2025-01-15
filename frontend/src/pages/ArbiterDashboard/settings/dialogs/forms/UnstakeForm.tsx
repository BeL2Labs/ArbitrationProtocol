import { DialogDescription } from "@/components/ui/dialog";
import { FC } from "react";

export const UnstakeForm: FC = () => {
  return (
    <div className="flex flex-col mt-6">
      <DialogDescription>You are about to remove all previous stake (coins, NFTs) from your arbiter.</DialogDescription>
    </div>
  )
}