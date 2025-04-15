// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Bytes,
  BigInt,
  BigDecimal,
} from "@graphprotocol/graph-ts";

export class ArbiterInfo extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save ArbiterInfo entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type ArbiterInfo must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("ArbiterInfo", id.toString(), this);
    }
  }

  static loadInBlock(id: string): ArbiterInfo | null {
    return changetype<ArbiterInfo | null>(
      store.get_in_block("ArbiterInfo", id),
    );
  }

  static load(id: string): ArbiterInfo | null {
    return changetype<ArbiterInfo | null>(store.get("ArbiterInfo", id));
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get createdAt(): i32 {
    let value = this.get("createdAt");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set createdAt(value: i32) {
    this.set("createdAt", Value.fromI32(value));
  }

  get deadLine(): i32 {
    let value = this.get("deadLine");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set deadLine(value: i32) {
    this.set("deadLine", Value.fromI32(value));
  }

  get address(): string {
    let value = this.get("address");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set address(value: string) {
    this.set("address", Value.fromString(value));
  }

  get ethFeeRate(): i32 {
    let value = this.get("ethFeeRate");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set ethFeeRate(value: i32) {
    this.set("ethFeeRate", Value.fromI32(value));
  }

  get btcFeeRate(): i32 {
    let value = this.get("btcFeeRate");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set btcFeeRate(value: i32) {
    this.set("btcFeeRate", Value.fromI32(value));
  }

  get paused(): boolean {
    let value = this.get("paused");
    if (!value || value.kind == ValueKind.NULL) {
      return false;
    } else {
      return value.toBoolean();
    }
  }

  set paused(value: boolean) {
    this.set("paused", Value.fromBoolean(value));
  }

  get activeTransactionId(): string | null {
    let value = this.get("activeTransactionId");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set activeTransactionId(value: string | null) {
    if (!value) {
      this.unset("activeTransactionId");
    } else {
      this.set("activeTransactionId", Value.fromString(<string>value));
    }
  }

  get ethAmount(): BigInt {
    let value = this.get("ethAmount");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set ethAmount(value: BigInt) {
    this.set("ethAmount", Value.fromBigInt(value));
  }

  get nftValue(): BigInt {
    let value = this.get("nftValue");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set nftValue(value: BigInt) {
    this.set("nftValue", Value.fromBigInt(value));
  }

  get erc20Token(): string | null {
    let value = this.get("erc20Token");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set erc20Token(value: string | null) {
    if (!value) {
      this.unset("erc20Token");
    } else {
      this.set("erc20Token", Value.fromString(<string>value));
    }
  }

  get nftContract(): string | null {
    let value = this.get("nftContract");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set nftContract(value: string | null) {
    if (!value) {
      this.unset("nftContract");
    } else {
      this.set("nftContract", Value.fromString(<string>value));
    }
  }

  get nftTokenIds(): Array<BigInt> | null {
    let value = this.get("nftTokenIds");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigIntArray();
    }
  }

  set nftTokenIds(value: Array<BigInt> | null) {
    if (!value) {
      this.unset("nftTokenIds");
    } else {
      this.set("nftTokenIds", Value.fromBigIntArray(<Array<BigInt>>value));
    }
  }

  get lastSubmittedWorkTime(): i32 {
    let value = this.get("lastSubmittedWorkTime");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set lastSubmittedWorkTime(value: i32) {
    this.set("lastSubmittedWorkTime", Value.fromI32(value));
  }

  get operatorEvmAddress(): string | null {
    let value = this.get("operatorEvmAddress");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set operatorEvmAddress(value: string | null) {
    if (!value) {
      this.unset("operatorEvmAddress");
    } else {
      this.set("operatorEvmAddress", Value.fromString(<string>value));
    }
  }

  get operatorBtcPubKey(): string | null {
    let value = this.get("operatorBtcPubKey");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set operatorBtcPubKey(value: string | null) {
    if (!value) {
      this.unset("operatorBtcPubKey");
    } else {
      this.set("operatorBtcPubKey", Value.fromString(<string>value));
    }
  }

  get operatorBtcAddress(): string | null {
    let value = this.get("operatorBtcAddress");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set operatorBtcAddress(value: string | null) {
    if (!value) {
      this.unset("operatorBtcAddress");
    } else {
      this.set("operatorBtcAddress", Value.fromString(<string>value));
    }
  }

  get revenueEvmAddress(): string | null {
    let value = this.get("revenueEvmAddress");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set revenueEvmAddress(value: string | null) {
    if (!value) {
      this.unset("revenueEvmAddress");
    } else {
      this.set("revenueEvmAddress", Value.fromString(<string>value));
    }
  }

  get revenueBtcPubKey(): string | null {
    let value = this.get("revenueBtcPubKey");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set revenueBtcPubKey(value: string | null) {
    if (!value) {
      this.unset("revenueBtcPubKey");
    } else {
      this.set("revenueBtcPubKey", Value.fromString(<string>value));
    }
  }

  get revenueBtcAddress(): string | null {
    let value = this.get("revenueBtcAddress");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set revenueBtcAddress(value: string | null) {
    if (!value) {
      this.unset("revenueBtcAddress");
    } else {
      this.set("revenueBtcAddress", Value.fromString(<string>value));
    }
  }

  get isActive(): boolean {
    let value = this.get("isActive");
    if (!value || value.kind == ValueKind.NULL) {
      return false;
    } else {
      return value.toBoolean();
    }
  }

  set isActive(value: boolean) {
    this.set("isActive", Value.fromBoolean(value));
  }
}

export class Transaction extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save Transaction entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type Transaction must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("Transaction", id.toString(), this);
    }
  }

  static loadInBlock(id: string): Transaction | null {
    return changetype<Transaction | null>(
      store.get_in_block("Transaction", id),
    );
  }

  static load(id: string): Transaction | null {
    return changetype<Transaction | null>(store.get("Transaction", id));
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get createdAt(): i32 {
    let value = this.get("createdAt");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set createdAt(value: i32) {
    this.set("createdAt", Value.fromI32(value));
  }

  get createdBy(): string {
    let value = this.get("createdBy");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set createdBy(value: string) {
    this.set("createdBy", Value.fromString(value));
  }

  get txId(): string {
    let value = this.get("txId");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set txId(value: string) {
    this.set("txId", Value.fromString(value));
  }

  get dapp(): string | null {
    let value = this.get("dapp");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set dapp(value: string | null) {
    if (!value) {
      this.unset("dapp");
    } else {
      this.set("dapp", Value.fromString(<string>value));
    }
  }

  get arbiter(): string | null {
    let value = this.get("arbiter");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set arbiter(value: string | null) {
    if (!value) {
      this.unset("arbiter");
    } else {
      this.set("arbiter", Value.fromString(<string>value));
    }
  }

  get startTime(): i32 {
    let value = this.get("startTime");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set startTime(value: i32) {
    this.set("startTime", Value.fromI32(value));
  }

  get deadline(): i32 {
    let value = this.get("deadline");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set deadline(value: i32) {
    this.set("deadline", Value.fromI32(value));
  }

  get status(): string {
    let value = this.get("status");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set status(value: string) {
    this.set("status", Value.fromString(value));
  }

  get depositedFee(): BigInt | null {
    let value = this.get("depositedFee");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set depositedFee(value: BigInt | null) {
    if (!value) {
      this.unset("depositedFee");
    } else {
      this.set("depositedFee", Value.fromBigInt(<BigInt>value));
    }
  }

  get arbitratorFeeNative(): BigInt | null {
    let value = this.get("arbitratorFeeNative");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set arbitratorFeeNative(value: BigInt | null) {
    if (!value) {
      this.unset("arbitratorFeeNative");
    } else {
      this.set("arbitratorFeeNative", Value.fromBigInt(<BigInt>value));
    }
  }

  get arbitratorFeeBTC(): BigInt | null {
    let value = this.get("arbitratorFeeBTC");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set arbitratorFeeBTC(value: BigInt | null) {
    if (!value) {
      this.unset("arbitratorFeeBTC");
    } else {
      this.set("arbitratorFeeBTC", Value.fromBigInt(<BigInt>value));
    }
  }

  get btcFeeAddress(): string | null {
    let value = this.get("btcFeeAddress");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set btcFeeAddress(value: string | null) {
    if (!value) {
      this.unset("btcFeeAddress");
    } else {
      this.set("btcFeeAddress", Value.fromString(<string>value));
    }
  }

  get refundedFee(): BigInt | null {
    let value = this.get("refundedFee");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set refundedFee(value: BigInt | null) {
    if (!value) {
      this.unset("refundedFee");
    } else {
      this.set("refundedFee", Value.fromBigInt(<BigInt>value));
    }
  }

  get systemFee(): BigInt | null {
    let value = this.get("systemFee");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set systemFee(value: BigInt | null) {
    if (!value) {
      this.unset("systemFee");
    } else {
      this.set("systemFee", Value.fromBigInt(<BigInt>value));
    }
  }

  get signature(): string | null {
    let value = this.get("signature");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set signature(value: string | null) {
    if (!value) {
      this.unset("signature");
    } else {
      this.set("signature", Value.fromString(<string>value));
    }
  }

  get compensationReceiver(): string | null {
    let value = this.get("compensationReceiver");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set compensationReceiver(value: string | null) {
    if (!value) {
      this.unset("compensationReceiver");
    } else {
      this.set("compensationReceiver", Value.fromString(<string>value));
    }
  }

  get timeoutCompensationReceiver(): string | null {
    let value = this.get("timeoutCompensationReceiver");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set timeoutCompensationReceiver(value: string | null) {
    if (!value) {
      this.unset("timeoutCompensationReceiver");
    } else {
      this.set("timeoutCompensationReceiver", Value.fromString(<string>value));
    }
  }

  get script(): string | null {
    let value = this.get("script");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set script(value: string | null) {
    if (!value) {
      this.unset("script");
    } else {
      this.set("script", Value.fromString(<string>value));
    }
  }

  get requestArbitrationTime(): i32 {
    let value = this.get("requestArbitrationTime");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set requestArbitrationTime(value: i32) {
    this.set("requestArbitrationTime", Value.fromI32(value));
  }
}

export class ArbitrationRequest extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save ArbitrationRequest entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type ArbitrationRequest must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("ArbitrationRequest", id.toString(), this);
    }
  }

  static loadInBlock(id: string): ArbitrationRequest | null {
    return changetype<ArbitrationRequest | null>(
      store.get_in_block("ArbitrationRequest", id),
    );
  }

  static load(id: string): ArbitrationRequest | null {
    return changetype<ArbitrationRequest | null>(
      store.get("ArbitrationRequest", id),
    );
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get txId(): BigInt {
    let value = this.get("txId");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set txId(value: BigInt) {
    this.set("txId", Value.fromBigInt(value));
  }

  get requester(): string {
    let value = this.get("requester");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set requester(value: string) {
    this.set("requester", Value.fromString(value));
  }

  get requestTime(): i32 {
    let value = this.get("requestTime");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set requestTime(value: i32) {
    this.set("requestTime", Value.fromI32(value));
  }

  get deadline(): i32 {
    let value = this.get("deadline");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set deadline(value: i32) {
    this.set("deadline", Value.fromI32(value));
  }

  get timeoutCompensationReceiver(): string {
    let value = this.get("timeoutCompensationReceiver");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set timeoutCompensationReceiver(value: string) {
    this.set("timeoutCompensationReceiver", Value.fromString(value));
  }

  get fulfilled(): boolean {
    let value = this.get("fulfilled");
    if (!value || value.kind == ValueKind.NULL) {
      return false;
    } else {
      return value.toBoolean();
    }
  }

  set fulfilled(value: boolean) {
    this.set("fulfilled", Value.fromBoolean(value));
  }
}

export class CompensationClaim extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save CompensationClaim entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type CompensationClaim must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("CompensationClaim", id.toString(), this);
    }
  }

  static loadInBlock(id: string): CompensationClaim | null {
    return changetype<CompensationClaim | null>(
      store.get_in_block("CompensationClaim", id),
    );
  }

  static load(id: string): CompensationClaim | null {
    return changetype<CompensationClaim | null>(
      store.get("CompensationClaim", id),
    );
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get createdAt(): i32 {
    let value = this.get("createdAt");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set createdAt(value: i32) {
    this.set("createdAt", Value.fromI32(value));
  }

  get claimType(): string {
    let value = this.get("claimType");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set claimType(value: string) {
    this.set("claimType", Value.fromString(value));
  }

  get claimer(): string | null {
    let value = this.get("claimer");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set claimer(value: string | null) {
    if (!value) {
      this.unset("claimer");
    } else {
      this.set("claimer", Value.fromString(<string>value));
    }
  }

  get arbiter(): string | null {
    let value = this.get("arbiter");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set arbiter(value: string | null) {
    if (!value) {
      this.unset("arbiter");
    } else {
      this.set("arbiter", Value.fromString(<string>value));
    }
  }

  get ethAmount(): BigInt | null {
    let value = this.get("ethAmount");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set ethAmount(value: BigInt | null) {
    if (!value) {
      this.unset("ethAmount");
    } else {
      this.set("ethAmount", Value.fromBigInt(<BigInt>value));
    }
  }

  get totalAmount(): BigInt | null {
    let value = this.get("totalAmount");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set totalAmount(value: BigInt | null) {
    if (!value) {
      this.unset("totalAmount");
    } else {
      this.set("totalAmount", Value.fromBigInt(<BigInt>value));
    }
  }

  get receivedCompensationAddress(): string | null {
    let value = this.get("receivedCompensationAddress");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set receivedCompensationAddress(value: string | null) {
    if (!value) {
      this.unset("receivedCompensationAddress");
    } else {
      this.set("receivedCompensationAddress", Value.fromString(<string>value));
    }
  }

  get withdrawn(): boolean {
    let value = this.get("withdrawn");
    if (!value || value.kind == ValueKind.NULL) {
      return false;
    } else {
      return value.toBoolean();
    }
  }

  set withdrawn(value: boolean) {
    this.set("withdrawn", Value.fromBoolean(value));
  }

  get systemFee(): BigInt | null {
    let value = this.get("systemFee");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set systemFee(value: BigInt | null) {
    if (!value) {
      this.unset("systemFee");
    } else {
      this.set("systemFee", Value.fromBigInt(<BigInt>value));
    }
  }

  get excessPaymentToClaimer(): BigInt | null {
    let value = this.get("excessPaymentToClaimer");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toBigInt();
    }
  }

  set excessPaymentToClaimer(value: BigInt | null) {
    if (!value) {
      this.unset("excessPaymentToClaimer");
    } else {
      this.set("excessPaymentToClaimer", Value.fromBigInt(<BigInt>value));
    }
  }
}

export class DApp extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save DApp entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type DApp must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("DApp", id.toString(), this);
    }
  }

  static loadInBlock(id: string): DApp | null {
    return changetype<DApp | null>(store.get_in_block("DApp", id));
  }

  static load(id: string): DApp | null {
    return changetype<DApp | null>(store.get("DApp", id));
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get createdAt(): i32 {
    let value = this.get("createdAt");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set createdAt(value: i32) {
    this.set("createdAt", Value.fromI32(value));
  }

  get address(): string {
    let value = this.get("address");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set address(value: string) {
    this.set("address", Value.fromString(value));
  }

  get owner(): string | null {
    let value = this.get("owner");
    if (!value || value.kind == ValueKind.NULL) {
      return null;
    } else {
      return value.toString();
    }
  }

  set owner(value: string | null) {
    if (!value) {
      this.unset("owner");
    } else {
      this.set("owner", Value.fromString(<string>value));
    }
  }

  get status(): string {
    let value = this.get("status");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set status(value: string) {
    this.set("status", Value.fromString(value));
  }
}

export class BPosNFT extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save BPosNFT entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type BPosNFT must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("BPosNFT", id.toString(), this);
    }
  }

  static loadInBlock(id: string): BPosNFT | null {
    return changetype<BPosNFT | null>(store.get_in_block("BPosNFT", id));
  }

  static load(id: string): BPosNFT | null {
    return changetype<BPosNFT | null>(store.get("BPosNFT", id));
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get createdAt(): i32 {
    let value = this.get("createdAt");
    if (!value || value.kind == ValueKind.NULL) {
      return 0;
    } else {
      return value.toI32();
    }
  }

  set createdAt(value: i32) {
    this.set("createdAt", Value.fromI32(value));
  }

  get owner(): string {
    let value = this.get("owner");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set owner(value: string) {
    this.set("owner", Value.fromString(value));
  }

  get tokenId(): BigInt {
    let value = this.get("tokenId");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set tokenId(value: BigInt) {
    this.set("tokenId", Value.fromBigInt(value));
  }
}

export class ConfigEntry extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id != null, "Cannot save ConfigEntry entity without an ID");
    if (id) {
      assert(
        id.kind == ValueKind.STRING,
        `Entities of type ConfigEntry must have an ID of type String but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      );
      store.set("ConfigEntry", id.toString(), this);
    }
  }

  static loadInBlock(id: string): ConfigEntry | null {
    return changetype<ConfigEntry | null>(
      store.get_in_block("ConfigEntry", id),
    );
  }

  static load(id: string): ConfigEntry | null {
    return changetype<ConfigEntry | null>(store.get("ConfigEntry", id));
  }

  get id(): string {
    let value = this.get("id");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get key(): string {
    let value = this.get("key");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toString();
    }
  }

  set key(value: string) {
    this.set("key", Value.fromString(value));
  }

  get value(): BigInt {
    let value = this.get("value");
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error("Cannot return null for a required field.");
    } else {
      return value.toBigInt();
    }
  }

  set value(value: BigInt) {
    this.set("value", Value.fromBigInt(value));
  }
}
