import { isNullBitcoinTxId } from "@/services/btc/btc";
import { Transaction as TransactionDTO } from "@/services/subgraph/dto/transaction";
import { tokenToReadableValue } from "@/services/tokens/tokens";
import BigNumber from "bignumber.js";
import { Expose, Transform } from "class-transformer";
import moment, { Moment } from "moment";
import { zeroAddress } from "viem";
import { ContractTransaction, UTXO } from "../dto/contract-transaction";

export type TransactionStatus = "Unknown" | "Active" | "Completed" | "Arbitrated" | "Expired" | "Disputed" | "Submitted";

export class Transaction implements Omit<TransactionDTO, "startTime" | "deadline" | "depositedFee" | "requestArbitrationTime"> {
  @Expose() public id: string;
  @Expose() public txId: string;
  @Expose() public dapp: string;
  @Expose() public arbiter: string;
  @Expose() public status: TransactionStatus;
  @Expose() @Transform(({ value }) => value && moment.unix(value)) public startTime: Moment;
  @Expose() @Transform(({ value }) => value && moment.unix(value)) public deadline: Moment;
  @Expose() @Transform(({ value }) => value && tokenToReadableValue(value, 18)) public depositedFee: BigNumber;
  @Expose() public signature: string;
  @Expose() public compensationReceiver: string;
  @Expose() public timeoutCompensationReceiver: string;
  @Expose() public utxos: UTXO[];
  @Expose() public script: string;
  @Expose() @Transform(({ value }) => value && moment.unix(value)) public requestArbitrationTime: Moment;

  public btcTxHash?: string; // Only when fetched from contract

  /**
   * So it's  abit tricky here. There is a transaction.status in the contract which is static,
   * and identical to what is returned by the subgraph. But, there is also getTransactionStatus(),
   * which can return a different status, in case of time based conditions such as current block time (not write
   * operation). So, UI needs to adjust the status sometimes using static, sometimes dynamic status.
   * 
   * transaction.status = contract.transaction.status
   * transaction.dynamicStatus = contract.getTransactionStatus()
   */
  public dynamicStatus: TransactionStatus;

  public static fromContractTransaction(contractTransaction: ContractTransaction, txId: string): Transaction {
    if (contractTransaction?.dapp === zeroAddress)
      return undefined;

    const transaction = new Transaction();

    transaction.id = txId;
    transaction.status = this.fromContractStatus(contractTransaction.status);
    transaction.btcTxHash = isNullBitcoinTxId(contractTransaction.btcTxHash?.slice(2)) ? undefined : contractTransaction.btcTxHash?.slice(2);
    transaction.compensationReceiver = contractTransaction.compensationReceiver;
    transaction.timeoutCompensationReceiver = contractTransaction.timeoutCompensationReceiver;
    transaction.utxos = contractTransaction.utxos; // TODO: remove 0x prefix for each UTXO?
    transaction.script = contractTransaction.script;
    transaction.signature = contractTransaction.signature;
    transaction.dapp = contractTransaction.dapp;
    transaction.status = this.fromContractStatus(contractTransaction.status);
    transaction.arbiter = contractTransaction.arbitrator;
    transaction.startTime = moment.unix(parseInt(contractTransaction.startTime));
    transaction.deadline = moment.unix(parseInt(contractTransaction.deadline));
    transaction.requestArbitrationTime = moment.unix(parseInt(contractTransaction.requestArbitrationTime));
    transaction.depositedFee = contractTransaction.depositedFee && tokenToReadableValue(contractTransaction.depositedFee, 18);

    return transaction;
  }

  public static fromContractStatus(contractStatus: number): TransactionStatus {
    switch (contractStatus) {
      case 0: return "Active";
      case 1: return "Completed";
      case 2: return "Arbitrated";
      case 3: return "Expired";
      case 4: return "Disputed";
      case 5: return "Submitted";
      default: return "Unknown";
    }
  }
}