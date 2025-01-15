import { reverseHexString } from "@/services/evm/conversions";
// import ecc from '@bitcoinerlab/secp256k1';
import BigNumber from "bignumber.js";
import 'bip66';
import { encode } from "bip66";
// import { initEccLib } from "bitcoinjs-lib";
import { Transaction } from "bitcoinjs-lib";

// Init curve for BTC taproot address support
// initEccLib(ecc);

export const satsPerBTC = new BigNumber("100000000");

export const BTC_ZERO_64 = "0000000000000000000000000000000000000000000000000000000000000000";
export const BTC_ZERO_64_WITH_PREFIX = `0x${BTC_ZERO_64}`;

export const btcToSats = (btc: BigNumber | string | number): BigNumber => {
  return satsPerBTC.multipliedBy(btc);
}

export const satsToBtc = (sats: BigNumber | string): BigNumber => {
  return new BigNumber(sats).dividedBy(satsPerBTC);
}

/**
 * Rounds the given BTC value, which might contain lots of decimals (eg after rate conversion)
 * into the closest valid satoshi value.
 */
export const toClosestValidValue = (btcAmount: BigNumber): BigNumber => {
  if (!btcAmount)
    return undefined;

  return btcAmount.multipliedBy(satsPerBTC).decimalPlaces(0).dividedBy(satsPerBTC);
}

export const parseTransactionHex = (btcTxHex: string): Transaction => {
  return Transaction.fromHex(btcTxHex);
}

/**
 * Converts a bytes sequence coming from bitcoin chain such a transaction or block ID, not
 * starting with 0x, into a reverted endianness string starting with 0x (to use on an EVM).
 */
export const btcToEVMHexBytes = (btcHexBytes: string): string => {
  return reverseHexString(`0x${btcHexBytes}`);
}

export const isNullBitcoinTxId = (txId: string): boolean => {
  return !txId || txId == BTC_ZERO_64;
}

export const isValidBtcTransactionHash = (hash: string): boolean => {
  if (hash.length !== 64)
    return false;

  // Check if all characters are valid hexadecimal digits
  const hexRegex = /^[0-9a-fA-F]+$/;
  return hexRegex.test(hash);
}

/**
 * Converts a 64 bytes string coming from a bitcoin wallet signData(), made of R|S components,
 * into a DER signature ready to publish as a bitcoin transaction.
 */
export const rsSignatureToDer = (rs: string): string => {
  const rsBuffer = Buffer.from(rs, "hex");
  if (rsBuffer.length != 64)
    throw new Error('Invalid rs string signature length. Buffer length is ${rsBuffer.length}, expected 64');

  // Check for leading zeros indicating positive values - otherwise we can get "R is negative" errors.
  const isRPaddingNeeded = rsBuffer[0] & 0x80;
  const isSPaddingNeeded = rsBuffer[32] & 0x80;

  // Extract R and S with padding for negative values if needed
  const r = isRPaddingNeeded ? Buffer.concat([new Uint8Array([0]), rsBuffer.subarray(0, 32)]) : rsBuffer.subarray(0, 32);
  const s = isSPaddingNeeded ? Buffer.concat([new Uint8Array([0]), rsBuffer.subarray(32)]) : rsBuffer.subarray(32);

  // console.log("r", r);
  // console.log("s", s);

  if (![32, 33].includes(r.length) || ![32, 33].includes(s.length))
    throw new Error('Invalid r or s length');

  const derSignature = encode(r, s);
  const hexDerSignature = Buffer.from(derSignature).toString('hex');

  console.log('DER-encoded signature:', hexDerSignature);

  return hexDerSignature;
}

/**
 * Checks if a string is a valid BTC address.
 */
export const isValidBitcoinAddress = (address: string): boolean => {
  // Regular expressions for different Bitcoin address formats
  const p2pkhRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const p2shRegex = /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const bech32Regex = /^(bc1)[a-z0-9]{39,59}$/;
  const bech32mRegex = /^(bc1p)[a-z0-9]{56}$/;

  // Check against each regex
  if (p2pkhRegex.test(address)) {
    return true;
  }

  if (p2shRegex.test(address)) {
    return true;
  }

  if (bech32Regex.test(address) || bech32mRegex.test(address)) {
    return true;
  }

  return false;
}

export const isValidBitcoinPublicKey = (publicKey: string): boolean => {
  // Check if the public key is a valid hexadecimal string
  const hexRegex = /^[0-9a-fA-F]+$/;
  if (!hexRegex.test(publicKey)) {
    return false;
  }

  // Convert the public key to a byte array
  const publicKeyBytes = Buffer.from(publicKey, 'hex');

  // Check for compressed public key (33 bytes, starting with 02 or 03)
  if (publicKeyBytes.length === 33 && (publicKeyBytes[0] === 0x02 || publicKeyBytes[0] === 0x03)) {
    return true;
  }

  // Check for uncompressed public key (65 bytes, starting with 04)
  if (publicKeyBytes.length === 65 && publicKeyBytes[0] === 0x04) {
    return true;
  }

  return false;
}
