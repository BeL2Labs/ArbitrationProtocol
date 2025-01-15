import { StatusLabel } from "@/components/base/StatusLabel";
import { useArbiterFrozenInfo } from "@/services/arbiters/hooks/useArbiterFrozenInfo";
import { ArbiterInfo } from "@/services/arbiters/model/arbiter-info";
import moment from "moment";
import { FC } from "react";

export const SecondaryArbiterStatusLabel: FC<{ arbiter: ArbiterInfo }> = ({ arbiter }) => {
  const { isFrozen, unfrozenTime } = useArbiterFrozenInfo(arbiter);

  // Available arbiter? show nothing else
  if (arbiter.isActive)
    return null;
  else if (isFrozen)
    return <StatusLabel title="Frozen" color="yellow" />;
  else if (arbiter.activeTransactionId)
    return <StatusLabel title="Working" color="yellow" />;
  else if (arbiter.totalValue.eq(0))
    return <StatusLabel title="Stake" color="red" />;
  else if (moment.unix(arbiter.deadline).isBefore(moment()))
    return <StatusLabel title="Deadline" color="red" />;
  else
    return null;
}