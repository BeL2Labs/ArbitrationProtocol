import { Transaction as BTCTransaction } from "bitcoinjs-lib";
import { keccak256, toBeHex } from "ethers";
import { UTXO } from "../nownodes-api/model/types";
import { getUTXOs } from "../nownodes-api/nownodes-api";
import { Transaction } from "./model/transaction";

const TransactionBTCFeesStorageKey = 'TransactionBTCFees';

const SIGHASH_ALL_BUFFER = Buffer.from([BTCTransaction.SIGHASH_ALL]);
const DUST_VALUE = 546; // Minimum value in sats for a BTC output to be considered dust

type WithdrawnBTCFees = string[]; // list of arbiter transaction ids for which the arbiter has withdrawn the fees.

export function checkTransactionBTCFeesWithdrawn(transactionId: string) {
  const withdrawnBTCFees = getWithdrawnBTCFees();
  return withdrawnBTCFees.includes(transactionId);
}

export function markTransactionBTCFeesWithdrawn(transactionId: string) {
  const withdrawnBTCFees = getWithdrawnBTCFees();
  withdrawnBTCFees.push(transactionId);
  localStorage.setItem(TransactionBTCFeesStorageKey, JSON.stringify(withdrawnBTCFees));
}

function getWithdrawnBTCFees() {
  return JSON.parse(localStorage.getItem(TransactionBTCFeesStorageKey) || '[]') as WithdrawnBTCFees;
}

/**
 * Checks if there are BTC fees to withdraw. We know this by checking the unique BTC fees address UTXOs.
 * If there is no UTXO, this means fees have been withdrawn. Otherwise, this means the arbiter can still
 * claims those fees.
 */
export async function checkOnChainTransactionBTCFeesWithdrawn(transaction: Transaction) {
  const transactionBtcFeesAddress = transaction.btcFeeAddress;
  if (!transactionBtcFeesAddress)
    return undefined;

  const utxoResult = await getUTXOs(transactionBtcFeesAddress);
  if (utxoResult?.length > 1)
    throw new Error(`Unsupported state for transaction ${transaction.id}. BTC fee address utxo cound should be 0 or 1, got ${utxoResult?.length}.`);

  return {
    utxo: utxoResult?.[0],
    withdrawn: utxoResult?.length === 0
  };
}

export type BTCFeeWithdrawlTxCreationInputs = {
  outputPubKey: string;
  satsPerVb: number; // sats/vb we are willing to pay to post the bitcoin tx. Usually defined by current network cost.
  inputs: {
    /**
     * The only UTXO available at the transaction's BTC fee address. We are sending it to the arbiter owner.
     */
    utxo: UTXO;
    /**
     * For the final btc tx, all inputs must contain the script specific to each input transaction.
     */
    script?: Buffer;
    /**
     * For the final btc tx, all inputs must contain the witness signature.
     */
    signature?: string;
  }[];
}

function computeTransactionValuesForBTCFeesWithdrawal(inputs: BTCFeeWithdrawlTxCreationInputs) {
  // First create a fake TX with placeholder witnesses, to simulate the largest 
  // possible fully signed transaction, to ensure we compute enough gas
  const fakeTx = new BTCTransaction();
  fakeTx.version = 2;
  const fakeWitnessSignature = Buffer.concat([Buffer.alloc(34), SIGHASH_ALL_BUFFER]);

  let outputValueSat = 0;
  inputs.inputs.forEach((input, index) => {
    if (!input.script)
      throw new Error(`Missing script for input at index ${index}`);

    outputValueSat += parseInt(input.utxo.value);
    fakeTx.addInput(Buffer.from(input.utxo.txid, 'hex').reverse(), input.utxo.vout, 0);
    fakeTx.setWitness(index, [fakeWitnessSignature, input.script]);
  });
  fakeTx.addOutput(Buffer.from(inputs.outputPubKey, "hex"), 0);

  // Deduce the tx cost from the expected output value
  const txSize = fakeTx.virtualSize(); // satspervb
  const txCostSat = Math.ceil(txSize * inputs.satsPerVb);
  const realOutputValueSat = Math.max(0, outputValueSat - txCostSat); // Output can never be below 0, and always an integer number of sats

  return { txCostSat, outputValueSat, realOutputValueSat }
}

export function generateRawTransactionForBTCFeeWithdrawal(inputs: BTCFeeWithdrawlTxCreationInputs, addWitnesses: boolean): BTCTransaction {
  console.log("inputs", inputs);
  const computedValues = computeTransactionValuesForBTCFeesWithdrawal(inputs);
  console.log("computedValues", computedValues)

  // TMP - RESTORE THIS
  // if (computedValues.realOutputValueSat <= DUST_VALUE)
  //   throw new Error(`Transaction output value is too small (dust). Planning to output ${computedValues.realOutputValueSat} sats, which is smaller than dust's ${computedValues.txCostSat} sats.`);

  const tx = new BTCTransaction();
  tx.version = 2;

  inputs.inputs.forEach((input, index) => {
    tx.addInput(Buffer.from(input.utxo.txid, 'hex').reverse(), input.utxo.vout, 0);
    if (addWitnesses) {
      if (!input.signature)
        throw new Error(`Missing signature for input at index ${index}`);
      tx.setWitness(index, [Buffer.from(input.signature, "hex"), input.script]);
    }
  });

  tx.addOutput(Buffer.from(inputs.outputPubKey, "hex"), computedValues.realOutputValueSat);

  return tx;
}

/**
 * Generates the script that needs to be used to sign every btc fee input from which an arbiter wants to withdraw 
 * BTC fees from.
 */
export function generateBtcFeeScript(outputPubKey: string, transaction: Transaction): Buffer {
  const pubkey = outputPubKey;
  const id = transaction.id;
  const sender = transaction.createdBy;
  const timestamp = transaction.startTime.unix();

  // Convert inputs to Buffers
  const uint256Timestamp = toBeHex(timestamp, 32);// Current UNIX timestamp
  const timestampBuf = Buffer.alloc(32);
  timestampBuf.writeBigUInt64BE(BigInt(uint256Timestamp), 24); // Store uint256 as 32 bytes (big-endian)

  const senderBuf = Buffer.from(sender.slice(2), 'hex'); // Remove '0x' prefix
  const idBuf = Buffer.from(id.slice(2), 'hex'); // Remove '0x' prefix if present
  const pubkeyBuf = Buffer.from(pubkey.slice(2), 'hex'); // Remove '0x' prefix

  const data = Buffer.concat([timestampBuf, senderBuf, idBuf]);

  // Calculate randomSeed (keccak256 equivalent)
  const randomSeed = keccak256(data);

  // Build the lock script
  const lockScript = Buffer.concat([
    Buffer.from('20', 'hex'), // Push 32 bytes (0x20 is the length)
    Buffer.from(randomSeed.slice(2), 'hex'), // The 32-byte random seed
    Buffer.from('75', 'hex'),  // OP_DROP
    Buffer.from([pubkeyBuf.length]), // Push pubkey length byte
    pubkeyBuf,                   // The actual public key
    Buffer.from('ac', 'hex')   // OP_CHECKSIG
  ]);

  return lockScript;
}