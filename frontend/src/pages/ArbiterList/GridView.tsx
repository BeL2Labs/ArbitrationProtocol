import { CopyField } from "@/components/base/CopyField";
import { StatusLabel } from "@/components/base/StatusLabel";
import { TokenWithValue } from "@/components/base/TokenWithValue";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { arbiterStatusLabelColor, arbiterStatusLabelTitle } from "@/services/arbiters/arbiters.service";
import { ArbiterInfo } from "@/services/arbiters/model/arbiter-info";
import { useActiveEVMChainConfig } from "@/services/chains/hooks/useActiveEVMChainConfig";
import { formatDate } from "@/utils/dates";
import { formatAddress } from "@/utils/formatAddress";
import { ChevronsUpDown } from "lucide-react";
import { FC } from "react";
import { SecondaryArbiterStatusLabel } from "./components/SecondaryArbiterStatusLabel";

export const GridView: FC<{
  arbiters: ArbiterInfo[];
  showOperatorInfo: boolean;
  onOperatorVisibilityChange: (visible: boolean) => void;
}> = ({ arbiters, showOperatorInfo, onOperatorVisibilityChange }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {arbiters.map(arbiter => <ArbiterGridItem
        key={arbiter.address}
        arbiter={arbiter}
        showOperatorInfo={showOperatorInfo}
        onOperatorVisibilityChange={onOperatorVisibilityChange} />)}
    </div>
  )
}

const ArbiterGridItem: FC<{
  arbiter: ArbiterInfo;
  showOperatorInfo: boolean;
  onOperatorVisibilityChange: (visible: boolean) => void;
}> = ({ arbiter, showOperatorInfo, onOperatorVisibilityChange }) => {
  const activeChain = useActiveEVMChainConfig();
  const deadline = arbiter.getDeadlineDate();

  return <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-lg font-semibold">
        {arbiter.address.slice(0, 6)}...{arbiter.address.slice(-4)}
        <CopyField value={arbiter.address} />
      </h3>
      <div className="flex gap-1">
        <StatusLabel title={arbiterStatusLabelTitle(arbiter)} color={arbiterStatusLabelColor(arbiter)} />
        <SecondaryArbiterStatusLabel arbiter={arbiter} />
      </div>
    </div>
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-600">Stake</span>
        <TokenWithValue amount={arbiter.totalValue} token={activeChain?.nativeCurrency} />
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Fee Rate</span>
        <span>{Number(arbiter.currentFeeRate) / 100} %</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Deadline</span>
        <span>{deadline ? formatDate(deadline, "YYYY/MM/DD") : '-'}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Active transaction</span>
        {arbiter.activeTransactionId ? <div className="flex items-center gap-2">{formatAddress(arbiter.activeTransactionId)} <CopyField value={arbiter.activeTransactionId} padding={false} /></div> : "-"}
      </div>
      <div className="mt-4 pt-4 border-t">
        <Collapsible open={showOperatorInfo} onOpenChange={onOperatorVisibilityChange}>
          <CollapsibleTrigger className="w-full">
            <div className="flex justify-between items-center w-full">
              <span className="text-gray-600">Operator</span>
              <div className="flex items-center">
                <ChevronsUpDown className="h-3 w-3" />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex justify-between items-center w-full">
              <span className="text-gray-600">EVM Address</span>
              <div>
                <span>{formatAddress(arbiter.operatorEvmAddress)}</span>
                <CopyField value={arbiter.operatorEvmAddress} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">BTC Address</span>
              <div>
                <span>{formatAddress(arbiter.operatorBtcAddress)}</span>
                <CopyField value={arbiter.operatorBtcAddress} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">BTC Pub Key</span>
              <div>
                <span>{formatAddress(arbiter.operatorBtcPubKey)}</span>
                <CopyField value={arbiter.operatorBtcPubKey} />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  </div>
}