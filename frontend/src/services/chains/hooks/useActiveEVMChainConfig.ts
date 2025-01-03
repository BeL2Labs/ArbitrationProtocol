import { defaultChainConfig } from "@/config/chains";
import { useWalletContext } from "@/contexts/WalletContext/WalletContext";
import { useMemo } from "react";
import { getChainConfigById } from "../chains";

/**
 * Returns the currently active chain in the connected EVM wallet.
 * If not connected or if chain is not supported, returns the default
 * chain config (elastos)
 */
export const useActiveEVMChainConfig = (useDefaultIfNeeded = true) => {
  const { evmChainId } = useWalletContext();
  const chainConfig = useMemo(() => getChainConfigById(evmChainId), [evmChainId]);

  if (chainConfig)
    return chainConfig;

  if (useDefaultIfNeeded)
    return defaultChainConfig;

  return undefined;
}