import BTCIcon from "@/assets/tokens/btc.svg";
import USDCIcon from "@/assets/tokens/usdc.svg";
import USDTIcon from "@/assets/tokens/usdt.svg";
import { isDevelopmentEnv } from "@/config/env";
import { ChainConfig } from "@/services/chains/chain-config";
import BigNumber from "bignumber.js";
import { TokenOrNative } from "./token-or-native";

console.log("BTCIcon", BTCIcon)

export const nativeCoin = (symbol: string, wrappedAddress: string, icon: string, displayDecimals: number, canPlaceOrders = true): TokenOrNative => {
  return { symbol, isNative: true, icon, displayDecimals, wrappedAddress, canPlaceOrders };
}

export const erc20Token = (symbol: string, contractAddress: string, icon: string, decimals: number, displayDecimals: number, minPlaceAmount: number, maxPlaceAmount: number): TokenOrNative => {
  return { symbol, isNative: false, contractAddress, icon, decimals, displayDecimals, minPlaceAmount, maxPlaceAmount, canPlaceOrders: true };
}

// ESC mainnet
export const escBtcToken = nativeCoin("BTC", "0xDF4191Bfe8FAE019fD6aF9433E8ED6bfC4B90CA1", BTCIcon, 6, false);
export const escUSDTToken = erc20Token("USDT", "0x0daddd286487f3a03Ea9A1b693585fD46cdCcF9F", USDTIcon, 18, 2, isDevelopmentEnv() ? 1 : 10, 100);
export const escUSDCToken = erc20Token("USDC", "0xA06be0F5950781cE28D965E5EFc6996e88a8C141", USDCIcon, 6, 2, isDevelopmentEnv() ? 1 : 10, 100);

// ESC testnet - tokens deployed by zhang xiaobin
export const escTestnetBtcToken = nativeCoin("BTC", "0x2aD066FBFeCaD8D06Af389A36cE1A4cFa4711443", BTCIcon, 8, false);
export const escTestnetUSDTToken = erc20Token("USDT", "0x892A0c0951091A8a072A4b652926D4A8875F9bcB", USDTIcon, 18, 2, isDevelopmentEnv() ? 1 : 10, 100);

// Starknet sepolia (L2 token addresses)
export const snSepoliaBtcToken = nativeCoin("BTC", "", BTCIcon, 6, false);
export const snSepoliaUSDTToken = erc20Token("USDT", "0x02ab8758891e84b968ff11361789070c6b1af2df618d6d2f4a78b0757573c6eb", USDTIcon, 6, 2, isDevelopmentEnv() ? 1 : 10, 100);
export const snSepoliaFakeUSDTToken = erc20Token("USDT", "0x4f28c3cc48b5cee48836547c8bf90ae29a9415ce5a425632aa27351724243a4", USDTIcon, 18, 2, isDevelopmentEnv() ? 1 : 10, 100);

export const getTokenByAddress = (chain: ChainConfig, tokenAddress: string, throwIfNotfound = true): TokenOrNative => {
  const token = chain?.tokens.find(t => t.contractAddress === tokenAddress);
  if (!token && throwIfNotfound)
    throw new Error(`getTokenByAddress(): unable to find token with address ${tokenAddress} in the current chaing config`);

  return token;
}

/**
 * Returns the USDT token of the given chain.
 */
export const getTokenBySymbol = (chain: ChainConfig, symbol: string): TokenOrNative => {
  if (!chain || !symbol)
    return undefined;

  return chain?.tokens.find(t => t.symbol === symbol.toUpperCase());
}

/**
 * Converts a token readable value (eth) to contract value (wei)
 */
export const tokenToContractValue = (humanReadableValue: BigNumber | string | number, decimals: number): BigNumber => {
  if (humanReadableValue === undefined)
    return undefined;
  return new BigNumber(humanReadableValue).multipliedBy((new BigNumber(10)).pow(decimals));
}

/**
 * Converts a token contract value (wei) to readable value (eth)
 */
export const tokenToReadableValue = (contractValue: BigNumber | BigInt | string | number, decimals: number): BigNumber => {
  if (contractValue === undefined)
    return undefined;

  if (typeof contractValue === "bigint")
    return new BigNumber(contractValue.toString()).dividedBy((new BigNumber(10)).pow(decimals));
  else
    return new BigNumber(contractValue as (BigNumber | string | number)).dividedBy((new BigNumber(10)).pow(decimals));
}