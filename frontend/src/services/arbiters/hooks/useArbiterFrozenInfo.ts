import { useConfigManager } from "@/services/config-manager/hooks/useConfigManager";
import moment, { Moment } from "moment";
import { useMemo } from "react";
import { ArbiterInfo } from "../model/arbiter-info";

/**
 * Period of time after working during which the arbiter is frozen.
 * Usually something like 30 minutes.
 * 
 * This hook is for the locally computed frozen status as we have all the info we need, not fetched from contract.
 */
export const useArbiterFrozenInfo = (arbiter: ArbiterInfo): { isFrozen: boolean, unfrozenTime: Moment } => {
  const { configSettings } = useConfigManager();

  return useMemo(() => {
    if (!configSettings || !arbiter)
      return { isFrozen: undefined, unfrozenTime: undefined };

    const unfrozenTime = arbiter.lastSubmittedWorkTime && moment(arbiter.lastSubmittedWorkTime).add(Number(configSettings.arbitrationFrozenPeriod), "seconds");
    const isFrozen = unfrozenTime ? moment().isBefore(unfrozenTime) : false;

    return { isFrozen, unfrozenTime };
  }, [configSettings, arbiter]);
}
