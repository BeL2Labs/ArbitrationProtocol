import { isEVMNullAddress } from "@/services/evm/evm";
import { ArbiterInfo as ArbiterInfoDTO } from "@/services/subgraph/dto/arbiter-info";
import { tokenToReadableValue } from "@/services/tokens/tokens";
import BigNumber from "bignumber.js";
import { Expose, Transform, Type } from "class-transformer";
import moment, { Moment } from "moment";
import { zeroAddress } from "viem";
import { ContractArbiterInfo } from "../dto/contract-arbiter-info";

/**
 * class-transformer is used for SUBGRAPH dtos, not contract ones.
 */
export class ArbiterInfo implements Omit<ArbiterInfoDTO, "ethAmount" | "createdAt" | "currentFeeRate" | "pendingFeeRate" | "isActive"> {
  @Expose() public id: string;
  @Expose() public address: string;
  @Expose() @Transform(({ value }) => tokenToReadableValue(value, 18)) public ethAmount: BigNumber; // Number of native coins not including NFT values
  @Expose() @Transform(({ value }) => tokenToReadableValue(value, 18)) public nftValue: BigNumber; // Readable amount of native coin represented by the staked NFTs.
  @Expose({}) public paused: boolean;
  @Expose() @Transform(({ value }) => new Date(value * 1000)) public createdAt: Date;
  @Expose({ name: "deadLine" }) public deadline: number;
  @Expose() @Type(() => Number) public currentFeeRate: number; // Fee rate with 100 basis. 100 means 1%
  @Expose() @Type(() => Number) public pendingFeeRate: number;
  @Expose() public activeTransactionId: string;
  @Expose() public operatorEvmAddress: string;
  @Expose() public operatorBtcAddress: string;
  @Expose() public operatorBtcPubKey: string;
  @Expose() public revenueEvmAddress: string;
  @Expose() public revenueBtcAddress: string;
  @Expose() public revenueBtcPubKey: string;
  @Expose() public isActive: boolean;
  @Expose() @Transform(({ value }) => value && new Date(value * 1000)) public lastSubmittedWorkTime: Date;

  /**
   * From contract calls only
   */
  public totalValue: BigNumber; // Total stake, human readable amount, ethAmount + nftvalue.

  public isPaused(): boolean {
    return this.paused;
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  public getDeadlineDate(): Moment {
    if (!this.deadline)
      return null;

    return moment.unix(this.deadline);
  }

  /**
   * Manual way of setting the NFT value which is automatically retrieved from the subgraph, but requires
   * an additional contract call when fetching arbiters directly from the contract.
   */
  public setNFTValue(value: BigNumber) {
    this.nftValue = value;
  }

  public static fromContractArbiterInfo(contractInfo: ContractArbiterInfo): ArbiterInfo {
    if (contractInfo?.arbitrator === zeroAddress)
      return undefined;

    const arbiter = new ArbiterInfo();

    arbiter.id = contractInfo.arbitrator;
    arbiter.address = contractInfo.arbitrator;
    arbiter.ethAmount = tokenToReadableValue(contractInfo.ethAmount, 18);
    arbiter.createdAt = null;
    arbiter.paused = contractInfo.paused;
    arbiter.deadline = Number(contractInfo.deadLine);
    arbiter.currentFeeRate = Number(contractInfo.currentFeeRate);
    arbiter.activeTransactionId = !isEVMNullAddress(contractInfo.activeTransactionId) ? contractInfo.activeTransactionId : null;
    arbiter.operatorEvmAddress = contractInfo.operator;
    arbiter.operatorBtcAddress = contractInfo.operatorBtcAddress;
    arbiter.operatorBtcPubKey = contractInfo.operatorBtcPubKey?.slice(2);
    arbiter.revenueEvmAddress = contractInfo.revenueETHAddress;
    arbiter.revenueBtcAddress = contractInfo.revenueBtcAddress;
    arbiter.revenueBtcPubKey = contractInfo.revenueBtcPubKey?.slice(2);
    arbiter.lastSubmittedWorkTime = contractInfo.lastSubmittedWorkTime ? new Date(Number(contractInfo.lastSubmittedWorkTime * 1000n)) : null;

    return arbiter;
  }
}