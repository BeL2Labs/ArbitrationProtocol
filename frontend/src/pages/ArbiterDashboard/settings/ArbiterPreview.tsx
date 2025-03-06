import { BoxTitle } from "@/components/base/BoxTitle";
import { ChildTooltip } from "@/components/base/ChildTooltip";
import { EnsureWalletNetwork } from "@/components/base/EnsureWalletNetwork/EnsureWalletNetwork";
import { StatusLabel } from "@/components/base/StatusLabel";
import { Button } from "@/components/ui/button";
import { useBackendArbiter } from "@/services/arbiter-backend/hooks/useBackendArbiter";
import { arbiterStatusLabelColor, arbiterStatusLabelTitle } from "@/services/arbiters/arbiters.service";
import { useArbiterConfigModifiable } from "@/services/arbiters/hooks/contract/useArbiterConfigModifiable";
import { useOwnedArbiter } from "@/services/arbiters/hooks/useOwnedArbiter";
import { ArbiterInfo } from "@/services/arbiters/model/arbiter-info";
import { useActiveEVMChainConfig } from "@/services/chains/hooks/useActiveEVMChainConfig";
import { useDynamicAddressFormat } from "@/services/ui/hooks/useDynamicAddressFormat";
import { formatDate } from "@/utils/dates";
import { BellIcon, CalendarIcon, DollarSignIcon, Layers2Icon, StarIcon } from "lucide-react";
import { FC, ReactNode, useCallback, useEffect, useState } from "react";
import { EditDeadlineDialog } from "./dialogs/EditDeadline";
import { EditFeeRateDialog } from "./dialogs/EditFeeRate";
import { EditNotificationsDialog } from "./dialogs/EditNotifications/EditNotifications";
import { EditOperatorDialog } from "./dialogs/EditOperator";
import { EditRevenueDialog } from "./dialogs/EditRevenue";
import { EditStakingDialog } from "./dialogs/EditStaking";

const InfoRow: FC<{
  title: string;
  value: ReactNode;
}> = ({ title, value }) => {
  return <div className="p-4 space-y-2">
    <div className="text-sm text-gray-500">{title}</div>
    <div className="font-normal">{value}</div>
  </div>
}

type OpenDialog = 'EditFeeRate' | 'EditDeadline' | 'EditOperator' | 'EditStaking' | 'EditRevenue' | 'EditNotifications';

export const ArbiterPreview: FC<{
  arbiter: ArbiterInfo;
}> = ({ arbiter }) => {
  const termEnd = arbiter.getDeadlineDate();
  const activeChain = useActiveEVMChainConfig();
  const { dynamicAddressFormat } = useDynamicAddressFormat();
  const [openDialog, setOpenDialog] = useState<OpenDialog>(undefined);
  const { fetchOwnedArbiter } = useOwnedArbiter();
  const isArbiterConfigModifiable = useArbiterConfigModifiable(arbiter);
  const { fetchBackendArbiterStatus, status: backendArbiterStatus, isFetchingStatus: isFetchingBackendArbiterStatus } = useBackendArbiter(arbiter.address);

  const handleArbiterUpdated = useCallback(() => {
    void fetchOwnedArbiter();
  }, [fetchOwnedArbiter]);

  useEffect(() => {
    void fetchBackendArbiterStatus();
  }, [fetchBackendArbiterStatus]);

  return (
    <div className="space-y-6">
      {/* Fixed info */}
      <div className="bg-white rounded-lg shadow divide-y">
        <InfoRow title="Address" value={dynamicAddressFormat(arbiter.address)} />
        <InfoRow title="Status" value={<StatusLabel
          title={arbiterStatusLabelTitle(arbiter)}
          color={arbiterStatusLabelColor(arbiter)}
        />} />
      </div>

      <div className="bg-white rounded-lg shadow divide-y">
        <div className='flex justify-between items-center mx-4 py-2'>
          <BoxTitle>Stake</BoxTitle>
          <EnsureWalletNetwork continuesTo="Edit" evmConnectedNeeded supportedNetworkNeeded>
            <ChildTooltip
              active={!isArbiterConfigModifiable}
              title="Staking unavailable"
              tooltip="Your arbiter is currently working on a transaction. Please wait for it to finish before editing the staking.">
              <Button disabled={!isArbiterConfigModifiable} onClick={() => setOpenDialog("EditStaking")}><Layers2Icon />Edit</Button>
            </ChildTooltip>
          </EnsureWalletNetwork>
        </div>
        <InfoRow title="Stake Amount" value={`
          ${arbiter.totalValue.toString()} ${activeChain?.nativeCurrency.symbol}
          (${arbiter.ethAmount.toString()} ${activeChain?.nativeCurrency.symbol} in native coins, ${arbiter.nftValue.toString()} ${activeChain?.nativeCurrency.symbol} in NFTs)
          `} />
      </div>

      <div className="bg-white rounded-lg shadow divide-y">
        <div className='flex justify-between items-center mx-4 py-2'>
          <BoxTitle>Main Settings</BoxTitle>
        </div>

        {/* Fee rate */}
        <div className="flex flex-row justify-between items-center pr-4">
          <InfoRow title="Fee Rate" value={`${arbiter.currentFeeRate / 100}%`} />
          <EnsureWalletNetwork continuesTo="Edit" evmConnectedNeeded supportedNetworkNeeded>
            <Button disabled={!isArbiterConfigModifiable} onClick={() => setOpenDialog("EditFeeRate")}><DollarSignIcon />Edit</Button>
          </EnsureWalletNetwork>
        </div>

        {/* Deadline */}
        <div className="flex flex-row justify-between items-center pr-4">
          <InfoRow title="Deadline" value={termEnd ? formatDate(termEnd) : "-"} />
          <EnsureWalletNetwork continuesTo="Edit" evmConnectedNeeded supportedNetworkNeeded>
            <Button disabled={!isArbiterConfigModifiable} onClick={() => setOpenDialog("EditDeadline")}><CalendarIcon />Edit</Button>
          </EnsureWalletNetwork>
        </div>
      </div>

      {/* Operator */}
      <div className="bg-white rounded-lg shadow divide-y">
        <div className='flex justify-between items-center mx-4 py-2'>
          <BoxTitle>Operator</BoxTitle>
          <EnsureWalletNetwork continuesTo="Edit" evmConnectedNeeded supportedNetworkNeeded>
            <Button disabled={!isArbiterConfigModifiable} onClick={() => setOpenDialog("EditOperator")}><StarIcon />Edit</Button>
          </EnsureWalletNetwork>
        </div>
        <InfoRow title="EVM Address" value={dynamicAddressFormat(arbiter.operatorEvmAddress) || "-"} />
        <InfoRow title="BTC Address" value={dynamicAddressFormat(arbiter.operatorBtcAddress) || "-"} />
        <InfoRow title="BTC Public Key" value={dynamicAddressFormat(arbiter.operatorBtcPubKey) || "-"} />
      </div>

      {/* Revenue */}
      <div className="bg-white rounded-lg shadow divide-y">
        <div className='flex justify-between items-center mx-4 py-2'>
          <BoxTitle>Revenue</BoxTitle>
          <EnsureWalletNetwork continuesTo="Edit" evmConnectedNeeded supportedNetworkNeeded>
            <Button disabled={!isArbiterConfigModifiable} onClick={() => setOpenDialog("EditRevenue")}><DollarSignIcon />Edit</Button>
          </EnsureWalletNetwork>
        </div>
        <InfoRow title="EVM Address" value={dynamicAddressFormat(arbiter.revenueEvmAddress) || "-"} />
        <InfoRow title="BTC Address" value={dynamicAddressFormat(arbiter.revenueBtcAddress) || "-"} />
        <InfoRow title="BTC Public Key" value={dynamicAddressFormat(arbiter.revenueBtcPubKey) || "-"} />
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-lg shadow divide-y">
        <div className='flex justify-between items-center mx-4 py-2'>
          <BoxTitle>Notifications</BoxTitle>
          <Button disabled={isFetchingBackendArbiterStatus} onClick={() => setOpenDialog("EditNotifications")}><BellIcon />Edit</Button>
        </div>
        <InfoRow title="Email notification" value={backendArbiterStatus?.emailKnown ? "Active" : "No email set yet"} />
      </div>

      <EditOperatorDialog arbiter={arbiter} isOpen={openDialog === "EditOperator"} onHandleClose={() => setOpenDialog(undefined)} onContractUpdated={handleArbiterUpdated} />
      <EditFeeRateDialog arbiter={arbiter} isOpen={openDialog === "EditFeeRate"} onHandleClose={() => setOpenDialog(undefined)} onContractUpdated={handleArbiterUpdated} />
      <EditDeadlineDialog arbiter={arbiter} isOpen={openDialog === "EditDeadline"} onHandleClose={() => setOpenDialog(undefined)} onContractUpdated={handleArbiterUpdated} />
      <EditStakingDialog arbiter={arbiter} isOpen={openDialog === "EditStaking"} onHandleClose={() => setOpenDialog(undefined)} onContractUpdated={handleArbiterUpdated} />
      <EditRevenueDialog arbiter={arbiter} isOpen={openDialog === "EditRevenue"} onHandleClose={() => setOpenDialog(undefined)} onContractUpdated={handleArbiterUpdated} />
      <EditNotificationsDialog arbiter={arbiter} isOpen={openDialog === "EditNotifications"} onHandleClose={() => setOpenDialog(undefined)} onContractUpdated={handleArbiterUpdated} />
    </div>
  )
}