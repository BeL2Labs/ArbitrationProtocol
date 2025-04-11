import { isNullBitcoinTxId } from "@/services/btc/btc";
import { Transaction as TransactionDTO } from "@/services/subgraph/dto/transaction";
import { tokenToReadableValue } from "@/services/tokens/tokens";
import BigNumber from "bignumber.js";
import { Expose, Transform } from "class-transformer";
import moment, { Moment } from "moment";
import { zeroAddress } from "viem";
import { ContractTransactionData, ContractTransactionParties } from "../dto/contract-transaction";

export type TransactionStatus = "Unknown" | "Active" | "Completed" | "Arbitrated" | "Expired" | "Disputed" | "Submitted";

export class Transaction implements Omit<TransactionDTO, "startTime" | "deadline" | "depositedFee" | "requestArbitrationTime"> {
  @Expose() public id: string;
  @Expose() public dapp: string;
  @Expose() public arbiter: string;
  @Expose() public status: TransactionStatus;
  @Expose() @Transform(({ value }) => value && moment.unix(value)) public startTime: Moment;
  @Expose() @Transform(({ value }) => value && moment.unix(value)) public deadline: Moment;
  @Expose() @Transform(({ value }) => value && tokenToReadableValue(value, 18)) public depositedFee: BigNumber;
  @Expose() @Transform(({ value }) => value && tokenToReadableValue(value, 18)) public arbitratorFeeNative: BigNumber;
  @Expose() @Transform(({ value }) => value && tokenToReadableValue(value, 18)) public arbitratorFeeBTC: BigNumber;
  @Expose() @Transform(({ value }) => value && tokenToReadableValue(value, 18)) public refundedFee: BigNumber;
  @Expose() @Transform(({ value }) => value && tokenToReadableValue(value, 18)) public systemFee: BigNumber;
  @Expose() public compensationReceiver: string;
  @Expose() public timeoutCompensationReceiver: string;
  @Expose() @Transform(({ value }) => value && moment.unix(value)) public requestArbitrationTime: Moment;

  public btcTxHash?: string; // Only when fetched from contract

  /**
   * So it's a bit tricky here. There is a transaction.status in the contract which is static,
   * and identical to what is returned by the subgraph. But, there is also getTransactionStatus(),
   * which can return a different status, in case of time based conditions such as current block time (not write
   * operation). So, UI needs to adjust the status sometimes using static, sometimes dynamic status.
   * 
   * transaction.status = contract.transaction.status
   * transaction.dynamicStatus = contract.getTransactionStatus()
   */
  public dynamicStatus: TransactionStatus;

  public static fromContractTransaction(contractTransactionData: ContractTransactionData, contractTransactionParties: ContractTransactionParties, contractTransactionBtcTxHash: string, txId: string): Transaction {
    if (contractTransactionParties?.dapp === zeroAddress)
      return undefined;

    const transaction = new Transaction();

    transaction.id = txId;
    // Transaction data
    transaction.startTime = moment.unix(parseInt(contractTransactionData.startTime));
    transaction.deadline = moment.unix(parseInt(contractTransactionData.deadline));
    transaction.requestArbitrationTime = moment.unix(parseInt(contractTransactionData.requestArbitrationTime));
    transaction.depositedFee = contractTransactionData.depositedFee && tokenToReadableValue(contractTransactionData.depositedFee, 18);
    transaction.status = this.fromContractStatus(contractTransactionData.status);

    // Transaction partis
    transaction.dapp = contractTransactionParties.dapp;
    transaction.compensationReceiver = contractTransactionParties.compensationReceiver;
    transaction.timeoutCompensationReceiver = contractTransactionParties.timeoutCompensationReceiver;
    transaction.arbiter = contractTransactionParties.arbitrator;

    transaction.btcTxHash = isNullBitcoinTxId(contractTransactionBtcTxHash?.slice(2)) ? undefined : contractTransactionBtcTxHash?.slice(2);

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