import { EnsureWalletNetwork } from "@/components/base/EnsureWalletNetwork/EnsureWalletNetwork";
import { StakeType, StakeTypePicker } from "@/components/staking/StakeTypePicker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useArbiterStake } from "@/services/arbiters/hooks/contract/useArbiterStake";
import { useArbiterUnstake } from "@/services/arbiters/hooks/contract/useArbiterUnstake";
import { ArbiterInfo } from "@/services/arbiters/model/arbiter-info";
import { BPosNFT } from "@/services/bpos-nfts/model/bpos-nft";
import { useActiveEVMChainConfig } from "@/services/chains/hooks/useActiveEVMChainConfig";
import { useConfigManager } from "@/services/config-manager/hooks/useConfigManager";
import { useERC721Approve } from "@/services/erc721/hooks/useERC721Approve";
import { useERC721CheckApproval } from "@/services/erc721/hooks/useERC721CheckApproval";
import { useToasts } from "@/services/ui/hooks/useToasts";
import { zodResolver } from "@hookform/resolvers/zod";
import BigNumber from "bignumber.js";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useInterval } from "usehooks-ts";
import { z } from "zod";
import { StakeCoinForm } from "./forms/StakeCoinForm";
import { StakeNFTForm } from "./forms/StakeNFTForm";
import { UnstakeForm } from "./forms/UnstakeForm";

export const EditStakingDialog: FC<{
  arbiter: ArbiterInfo;
  isOpen: boolean;
  onHandleClose: () => void;
  onContractUpdated: () => void;
}> = ({ arbiter, isOpen, onContractUpdated, onHandleClose, ...rest }) => {
  const { configSettings } = useConfigManager();
  const activeChain = useActiveEVMChainConfig();
  const { successToast } = useToasts();
  const [stakeType, setStakeType] = useState<StakeType>("coin");
  const { checkApproved, isApproved: nftTransferIsApproved, isPending: isCheckingTransferApproval } = useERC721CheckApproval(activeChain?.contracts.bPoSNFT, activeChain?.contracts.arbitratorManager);
  const { approveNFTTransfer, isPending: isApprovingTokenTransfer } = useERC721Approve(activeChain?.contracts.bPoSNFT, activeChain?.contracts.arbitratorManager);
  const { stakeETH, stakeNFT, isPending: isStaking } = useArbiterStake();
  const { unstake, isPending: isUnstaking } = useArbiterUnstake();
  const isActionBusy = isStaking || isUnstaking;
  const [selectedNFTs, setSelectedNFTs] = useState<BPosNFT[]>([]);

  useInterval(checkApproved, 3000);

  const baseSchema = useMemo(() => z.object({}), []);

  const coinSchemaExtension = useMemo(() => z.object({
    coinAmount: z.coerce.number().min(Number(configSettings?.minStake)).max(Number(configSettings?.maxStake))
  }), [configSettings]);

  const nftSchemaExtension = useMemo(() => z.object({
    tokenIds: z.array(z.string()).min(1, "Select at least one NFT")
  }), []);

  const formSchema = useMemo(() => {
    let schema = baseSchema;

    if (stakeType === "coin")
      schema = schema.merge(coinSchemaExtension);

    if (stakeType === "nft")
      schema = schema.merge(nftSchemaExtension);

    return schema;
  }, [baseSchema, coinSchemaExtension, nftSchemaExtension, stakeType]);

  type PartialSchema = typeof formSchema & Partial<typeof coinSchemaExtension> & Partial<typeof nftSchemaExtension>;

  const form = useForm<z.infer<PartialSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Native coin
      coinAmount: 1,
      // NFT
      tokenIds: []
    }
  });

  // Force form to use the updated schema when schema has been changed because of a stake type change.
  useEffect(() => {
    form.reset();
  }, [formSchema, form]);

  // Temporary limitation of maximum staking amount
  const watchedCoinAmount = parseFloat(`${form.watch("coinAmount")}`); // Sometimes returned as number, sometimes string...
  const stakeAmount = useMemo(() => {
    let amount = arbiter.totalValue.toNumber();

    if (stakeType === "coin")
      amount += watchedCoinAmount;

    if (stakeType === "nft")
      amount += selectedNFTs.reduce((acc, nft) => acc + (nft.voteInfo?.getCoinValue() || 0), 0);

    return amount;
  }, [selectedNFTs, arbiter, stakeType, watchedCoinAmount]);

  const newAmountAllowsStaking = useMemo(() => stakeAmount >= configSettings?.minStake && stakeAmount <= configSettings?.maxStake, [configSettings, stakeAmount]);

  const handleApproveNFTTransfer = useCallback(async () => {
    await approveNFTTransfer();
    void checkApproved();
  }, [approveNFTTransfer, checkApproved]);

  const handleSubmit = useCallback(async (values: z.infer<PartialSchema>) => {
    try {
      if (stakeType === "coin") {
        console.log("Staking native coins", values);

        try {
          if (await stakeETH(new BigNumber(values.coinAmount))) {
            successToast(`Staking successful!`);
            onContractUpdated();
            onHandleClose();
          }
        } catch (error) {
          console.error('Error during native coin staking:', error);
        }
      }
      else if (stakeType === "nft") {
        console.log("Staking NFT", values);

        try {
          if (await stakeNFT(values.tokenIds)) {
            successToast(`Staking successful!`);
            onContractUpdated();
            onHandleClose();
          }
        } catch (error) {
          console.error('Error during NFT staking:', error);
        }
      }
      else if (stakeType === "unstake") {
        if (await unstake()) {
          arbiter.ethAmount = new BigNumber(0);
          arbiter.setNFTValue(new BigNumber(0));

          successToast("Unstaked successfully!");
          onHandleClose();
        }
      }
    } catch (error) {
      console.error('Error during arbiter registration:', error);
    }
  }, [stakeType, stakeETH, successToast, onContractUpdated, onHandleClose, stakeNFT, unstake, arbiter]);

  const actionButtonLabel = useMemo(() => {
    switch (stakeType) {
      case "coin":
        return "Add stake";
      case "nft":
        return "Stake NFT";
      case "unstake":
        return "Unstake";
    }
  }, [stakeType]);

  if (!arbiter)
    return null;

  return (
    <Dialog {...rest} open={isOpen} onOpenChange={onHandleClose}>
      <DialogContent aria-description="Edit Arbiter Staking">
        {/* Header */}
        <DialogHeader>
          <DialogTitle>Edit Arbiter Staking</DialogTitle>
          <DialogDescription>Increase stake, or withdraw everything, from your arbiter.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='flex flex-col gap-4 w-full items-center justify-center'>
            <StakeTypePicker value={stakeType} onChange={setStakeType} canUnstake={true} />
            {stakeType === "coin" && <StakeCoinForm form={form} />}
            {stakeType === "nft" && <StakeNFTForm form={form} onNFTSelectionChanged={setSelectedNFTs} />}
            {stakeType === "unstake" && <UnstakeForm />}

            {
              !newAmountAllowsStaking &&
              <div className='text-sm my-2 text-red-500'>
                Stake value should be higher than {Number(configSettings?.minStake)} {activeChain?.nativeCurrency.symbol} and lower than {Number(configSettings?.maxStake)} {activeChain?.nativeCurrency.symbol}.
                Now {stakeAmount} {activeChain?.nativeCurrency.symbol}.
              </div>
            }

            <div className="mt-6 flex justify-end space-x-3">
              {nftTransferIsApproved === false && stakeType === "nft" && <EnsureWalletNetwork continuesTo='Approve NFT Transfer'>
                <Button
                  type="button"
                  onClick={handleApproveNFTTransfer}
                  disabled={isApprovingTokenTransfer}>
                  Approve NFT Transfer
                </Button>
              </EnsureWalletNetwork>
              }
              {(nftTransferIsApproved === true || stakeType !== "nft") && <EnsureWalletNetwork continuesTo='Register'>
                <Button
                  type="submit"
                  disabled={!configSettings || isActionBusy || !newAmountAllowsStaking}
                  className={!form.formState.isValid && "opacity-30"}>
                  {actionButtonLabel}
                </Button>
              </EnsureWalletNetwork>
              }
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}