import { CompensationClaim as CompensationClaimDTO } from "@/services/subgraph/dto/compensation-claim";
import { tokenToReadableValue } from "@/services/tokens/tokens";
import BigNumber from "bignumber.js";
import { Expose, Transform } from "class-transformer";

export type CompensationType = "IllegalSignature" | "Timeout" | "FailedArbitration" | "ArbiterFee";

export class CompensationClaim implements Omit<CompensationClaimDTO, "ethAmount" | "createdAt" | "systemFee" | "totalAmount"> {
  @Expose() public id: string;
  @Expose() @Transform(({ value }) => value && new Date(value * 1000)) public createdAt: Date;
  @Expose() public claimer: string;
  @Expose() public arbiter: string;
  @Expose() public claimType: CompensationType;
  @Expose() public withdrawn: boolean;
  @Expose() @Transform(({ value }) => value && tokenToReadableValue(value, 18)) public ethAmount: BigNumber;
  @Expose() @Transform(({ value }) => value && tokenToReadableValue(value, 18)) public systemFee: BigNumber;
  @Expose() @Transform(({ value }) => value && tokenToReadableValue(value, 18)) public totalAmount: BigNumber;
  @Expose() public excessPaymentToClaimer: string;
  @Expose() public receivedCompensationAddress: string;
}