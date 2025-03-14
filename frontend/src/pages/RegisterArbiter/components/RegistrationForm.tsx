import { FeeRateType, FeeRateTypePicker } from '@/components/arbiters/FeeRateTypePicker';
import { BoxTitle } from '@/components/base/BoxTitle';
import { EnsureWalletNetwork } from '@/components/base/EnsureWalletNetwork/EnsureWalletNetwork';
import { IconTooltip } from '@/components/base/IconTooltip';
import { StakeType, StakeTypePicker } from '@/components/staking/StakeTypePicker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { tooltips } from '@/config/tooltips';
import { useWalletContext } from '@/contexts/WalletContext/WalletContext';
import { useArbiterRegister } from '@/services/arbiters/hooks/contract/useArbiterRegister';
import { BPosNFT } from '@/services/bpos-nfts/model/bpos-nft';
import { isValidBitcoinAddress, isValidBitcoinPublicKey } from '@/services/btc/btc';
import { useBitcoinWalletAction } from '@/services/btc/hooks/useBitcoinWalletAction';
import { useActiveEVMChainConfig } from '@/services/chains/hooks/useActiveEVMChainConfig';
import { useConfigManager } from '@/services/config-manager/hooks/useConfigManager';
import { useERC721Approve } from '@/services/erc721/hooks/useERC721Approve';
import { useERC721CheckApproval } from '@/services/erc721/hooks/useERC721CheckApproval';
import { useToasts } from '@/services/ui/hooks/useToasts';
import { formatDate } from '@/utils/dates';
import { cn } from '@/utils/shadcn';
import { zodResolver } from '@hookform/resolvers/zod';
import BigNumber from 'bignumber.js';
import { CalendarIcon } from 'lucide-react';
import { FC, useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useInterval } from 'usehooks-ts';
import { z } from 'zod';
import { StakeCoinForm } from './StakeCoinForm';
import { StakeNFTForm } from './StakeNFTForm';

export const DefaultELAFeeRate = 0.1;
export const DefaultBTCFeeRate = 0.1;

export const RegistrationForm: FC = () => {
  const activeChain = useActiveEVMChainConfig();
  const [stakeType, setStakeType] = useState<StakeType>("coin");
  const [feeRateType, setFeeRateType] = useState<FeeRateType>("btc");
  const { successToast } = useToasts();
  const navigate = useNavigate();
  const { configSettings } = useConfigManager();
  const { registerArbiterByStakeETH, registerArbiterByStakeNFT, isPending: isRegistering } = useArbiterRegister();
  const { bitcoinAccount } = useWalletContext();
  const { getPublicKey } = useBitcoinWalletAction();
  const { checkApproved, isApproved: nftTransferIsApproved, isPending: isCheckingTransferApproval } = useERC721CheckApproval(activeChain?.contracts.bPoSNFT, activeChain?.contracts.arbitratorManager);
  const { approveNFTTransfer, isPending: isApprovingTokenTransfer } = useERC721Approve(activeChain?.contracts.bPoSNFT, activeChain?.contracts.arbitratorManager);
  const [selectedNFTs, setSelectedNFTs] = useState<BPosNFT[]>([]);

  useInterval(checkApproved, 3000);

  /**
   * NOTE: ELA and BTC fee rates are exlusive. Arbiter owner must choose one or the other. When one of them
   * is set, the other value must be reset to 0.
   */
  const baseSchema = z.object({
    operatorBTCAddress: z.string().refine(isValidBitcoinAddress, "Not a valid Bitcoin address"),
    operatorBTCPubKey: z.string().refine(isValidBitcoinPublicKey, "Not a valid Bitcoin public key"),
    feeRate: z.coerce.number().min(0).max(100), // ELA fee rate
    btcFeeRate: z.coerce.number().min(0).max(100), // BTC fee rate
    deadline: z.date().min(new Date())
  });

  const coinSchemaExtension = z.object({
    coinAmount: z.coerce.number().min(Number(configSettings?.minStake)).max(Number(configSettings?.maxStake))
  });

  const nftSchemaExtension = z.object({
    tokenIds: z.array(z.string()).min(1, "Select at least one NFT")
  });

  const formSchema = useMemo(() => {
    let schema = baseSchema;

    if (stakeType === "coin")
      schema = schema.merge(coinSchemaExtension);

    if (stakeType === "nft")
      schema = schema.merge(nftSchemaExtension);

    return schema;
  }, [baseSchema, coinSchemaExtension, nftSchemaExtension, stakeType]);

  type PartialSchema = typeof formSchema &
    Partial<typeof coinSchemaExtension> &
    Partial<typeof nftSchemaExtension>;

  const form = useForm<z.infer<PartialSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      operatorBTCAddress: '',
      operatorBTCPubKey: '',
      feeRate: DefaultELAFeeRate,
      btcFeeRate: DefaultBTCFeeRate,
      deadline: new Date(),
      // Native coin
      coinAmount: 1,
      // NFT
      tokenIds: []
    }
  });

  // Temporary limitation of maximum staking amount
  const watchedCoinAmount = parseFloat(`${form.watch("coinAmount")}`); // Sometimes returned as number, sometimes string...
  const stakeAmount = useMemo(() => {
    let amount = 0;

    if (stakeType === "coin")
      amount += watchedCoinAmount;

    if (stakeType === "nft")
      amount += selectedNFTs.reduce((acc, nft) => acc + (nft.voteInfo?.getCoinValue() || 0), 0);

    return amount;
  }, [selectedNFTs, stakeType, watchedCoinAmount]);

  const newAmountAllowsStaking = useMemo(() => stakeAmount >= configSettings?.minStake && stakeAmount <= configSettings?.maxStake, [configSettings, stakeAmount]);

  const handleRegister = useCallback(async (values: z.infer<PartialSchema>) => {
    try {
      if (stakeType === "coin") {
        console.log("Registering arbiter using native coin stake", values);

        if (await registerArbiterByStakeETH(
          new BigNumber(values.coinAmount),
          values.operatorBTCAddress,
          values.operatorBTCPubKey,
          feeRateType === "ela" ? values.feeRate : 0,
          feeRateType === "btc" ? values.btcFeeRate : 0,
          Math.floor(values.deadline.getTime() / 1000)
        )) {
          successToast(`Arbiter successfully registered!`);
          navigate("/arbiters"); // Back to arbiters list.
        }
      }
      else if (stakeType === "nft") {
        console.log("Registering arbiter using NFT stake", values);

        if (await registerArbiterByStakeNFT(
          values.tokenIds,
          values.operatorBTCAddress,
          values.operatorBTCPubKey,
          feeRateType === "ela" ? values.feeRate : 0,
          feeRateType === "btc" ? values.btcFeeRate : 0,
          Math.floor(values.deadline.getTime() / 1000)
        )) {
          successToast(`Arbiter successfully registered!`);
          navigate("/arbiters"); // Back to arbiter list.
        }
      }
    } catch (error) {
      console.error('Error during arbiter registration:', error);
    }
  }, [feeRateType, navigate, registerArbiterByStakeETH, registerArbiterByStakeNFT, stakeType, successToast]);

  const handleImportOperatorFromWallet = useCallback(async () => {
    const pubKey = await getPublicKey();

    form.setValue("operatorBTCAddress", bitcoinAccount);
    form.setValue("operatorBTCPubKey", pubKey);

    // Revalidate the form
    void form.trigger();
  }, [bitcoinAccount, getPublicKey, form]);

  const handleApproveNFTTransfer = useCallback(async () => {
    await approveNFTTransfer();
    void checkApproved();
  }, [approveNFTTransfer, checkApproved]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleRegister)} className='flex flex-col gap-4 w-full items-center justify-center'>
        <div className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <BoxTitle>Settings</BoxTitle>

          {/* Fee rate selection */}
          <FormItem>
            <FormLabel>Fee rate</FormLabel>
            <FeeRateTypePicker value={feeRateType} onChange={setFeeRateType} />
          </FormItem>

          {/* ELA Fee Rate */}
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

          {/* Deadline */}
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deadline <IconTooltip title="Deadline" tooltip={tooltips.arbiterDeadline} iconClassName='ml-1' iconSize={12} /></FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          formatDate(field.value, "YYYY/MM/DD")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date <= new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className='flex items-center justify-between'>
            <BoxTitle>Operator</BoxTitle>
            <EnsureWalletNetwork continuesTo='Import from wallet' btcAccountNeeded>
              <Button type="button" onClick={handleImportOperatorFromWallet}>Import from wallet</Button>
            </EnsureWalletNetwork>
          </div>

          {/* Operator BTC address */}
          <FormField
            control={form.control}
            name="operatorBTCAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Operator BTC address</FormLabel>
                <Input {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Operator BTC public key */}
          <FormField
            control={form.control}
            name="operatorBTCPubKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Operator BTC public key</FormLabel>
                <Input {...field} />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <BoxTitle>Staking</BoxTitle>

          <FormItem>
            <FormLabel>Initial staking type</FormLabel>
            <StakeTypePicker value={stakeType} onChange={setStakeType} canUnstake={false} />
          </FormItem>

          {stakeType === "coin" && <StakeCoinForm form={form} />}
          {stakeType === "nft" && <StakeNFTForm form={form} onNFTSelectionChanged={setSelectedNFTs} />}

          {
            !newAmountAllowsStaking &&
            <div className='text-sm my-2 text-red-500'>
              Stake value should be higher than {Number(configSettings?.minStake)} {activeChain?.nativeCurrency.symbol} and lower than {Number(configSettings?.maxStake)} {activeChain?.nativeCurrency.symbol}.
              Now {stakeAmount} {activeChain?.nativeCurrency.symbol}.
            </div>
          }
        </div>

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
              disabled={!configSettings || isRegistering || !newAmountAllowsStaking}
              className={!form.formState.isValid && "opacity-30"}>
              Register
            </Button>
          </EnsureWalletNetwork>
          }
        </div>
      </form>
    </Form>
  )
}

