import { ethereum } from "@graphprotocol/graph-ts";
import { ArbitrationRequested, ArbitrationSubmitted, DepositFeeTransfer, OwnershipTransferred, TransactionCompleted, TransactionRegistered } from "../../generated/TransactionManager/TransactionManager";
import { Transaction } from "../../generated/schema";
import { recomputeArbitratorIsActive } from "./ArbitratorManager";

export function handleTransactionRegistered(event: TransactionRegistered): void {
  const transaction = getTransaction(event.block, event.params.id.toHexString());
  transaction.status = "Active";
  transaction.dapp = event.params.dapp.toHexString();
  transaction.arbiter = event.params.arbitrator.toHexString();
  transaction.startTime = event.block.timestamp.toI32();
  transaction.deadline = event.params.deadline.toI32();
  transaction.depositedFee = event.params.depositFee;
  transaction.compensationReceiver = event.params.compensationReceiver.toHexString();
  transaction.save();

  recomputeArbitratorIsActive(transaction.arbiter, event.block);
}

export function handleArbitrationRequested(event: ArbitrationRequested): void {
  const transaction = getTransaction(event.block, event.params.txId.toHexString());
  transaction.dapp = event.params.dapp.toHexString();
  transaction.arbiter = event.params.arbitrator.toHexString(); // Useless, same arbiter already saved by TransactionRegistered
  transaction.status = "Arbitrated";
  transaction.script = event.params.script.toHexString();
  transaction.timeoutCompensationReceiver = event.params.timeoutCompensationReceiver.toHexString();
  transaction.requestArbitrationTime = event.block.timestamp.toI32();
  transaction.save();

  recomputeArbitratorIsActive(transaction.arbiter, event.block);
}

export function handleArbitrationSubmitted(event: ArbitrationSubmitted): void {
  const transaction = getTransaction(event.block, event.params.txId.toHexString());
  transaction.dapp = event.params.dapp.toHexString();
  transaction.status = "Completed";
  transaction.save();

  recomputeArbitratorIsActive(transaction.arbiter, event.block);
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  // TODO: Implement
}

export function handleTransactionCompleted(event: TransactionCompleted): void {
  const transaction = getTransaction(event.block, event.params.txId.toHexString());
  transaction.status = "Completed";
  transaction.save();

  recomputeArbitratorIsActive(transaction.arbiter, event.block);
}

// Emitted when a transaction is completed. Fees are real amounts received by all parties.
export function handleDepositFeeTransfer(event: DepositFeeTransfer): void {
  const transaction = getTransaction(event.block, event.params.txId.toHexString());
  transaction.arbitratorFeeNative = event.params.arbitratorFee; // Fee in here is always for native.
  transaction.refundedFee = event.params.refundedFee;
  transaction.systemFee = event.params.systemFee;
  // UNUSED? = event.params.revenueETHAddress;
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
  transaction.createdAt = block.timestamp.toI32();
  transaction.status = "Active";
  transaction.txId = id;

  return transaction;
}
