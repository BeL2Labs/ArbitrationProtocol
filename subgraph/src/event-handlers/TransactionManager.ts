import { ethereum } from "@graphprotocol/graph-ts";
import { ArbitrationRequested, ArbitrationSubmitted, OwnershipTransferred, TransactionCompleted, TransactionRegistered } from "../../generated/TransactionManager/TransactionManager";
import { Transaction } from "../../generated/schema";

export function handleTransactionRegistered(event: TransactionRegistered): void {
  const transaction = getTransaction(event.block, event.params.id.toHexString());
  transaction.status = "Active";
  transaction.arbitrator = event.params.arbitrator.toHexString();
  transaction.save();
}

export function handleArbitrationRequested(event: ArbitrationRequested): void {
  const transaction = getTransaction(event.block, event.params.txId.toHexString());
  transaction.dapp = event.params.dapp.toHexString();
  transaction.status = "Arbitrated";
  transaction.save();
}

export function handleArbitrationSubmitted(event: ArbitrationSubmitted): void {
  const transaction = getTransaction(event.block, event.params.txId.toHexString());
  transaction.dapp = event.params.dapp.toHexString();
  transaction.status = "Completed";
  transaction.save();
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  // TODO: Implement
}

export function handleTransactionCompleted(event: TransactionCompleted): void {
  const transaction = getTransaction(event.block, event.params.txId.toHexString());
  transaction.status = "Completed";
  transaction.save();
}

/**
 * Gets the existing transaction if any, otherwise creates a new one.
 */
function getTransaction(block: ethereum.Block, id: string): Transaction {
  let existingTransaction = Transaction.load(id);

  if (existingTransaction) {
    return existingTransaction;
  }

  const transaction = new Transaction(id);
  transaction.createdAt = block.timestamp;
  transaction.status = "Active";
  transaction.txId = id;

  return transaction;
}
