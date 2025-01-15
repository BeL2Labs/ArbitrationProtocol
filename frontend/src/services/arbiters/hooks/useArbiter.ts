import { useEffect, useState } from "react";
import { ArbiterInfo } from "../model/arbiter-info";
import { useArbiterInfo } from "./contract/useArbiterInfo";

export const useArbiter = (arbiterAddress: string) => {
  const [arbiter, setArbiter] = useState<ArbiterInfo>();
  const { fetchArbiterInfo } = useArbiterInfo(arbiterAddress);

  useEffect(() => {
    if (arbiterAddress)
      void fetchArbiterInfo().then(setArbiter);
  }, [arbiterAddress, fetchArbiterInfo]);

  return arbiter;
}