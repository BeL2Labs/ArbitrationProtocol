import { Expose, Transform } from "class-transformer";
import moment, { Moment } from "moment";

export class Transaction {
  @Expose() public id: string;
  @Expose() public txId: string;
  @Expose() public dapp: string;
  @Expose() public arbiter: string;
  @Expose() @Transform(({ value }) => value && moment.unix(value)) public startTime: Moment;
  @Expose() @Transform(({ value }) => value && moment.unix(value)) public requestArbitrationTime: Moment;
  @Expose() @Transform(({ value }) => value && moment.unix(value)) public deadline: Moment;
}