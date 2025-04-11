// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt,
} from "@graphprotocol/graph-ts";

export class ConfigUpdated extends ethereum.Event {
  get params(): ConfigUpdated__Params {
    return new ConfigUpdated__Params(this);
  }
}

export class ConfigUpdated__Params {
  _event: ConfigUpdated;

  constructor(event: ConfigUpdated) {
    this._event = event;
  }

  get key(): Bytes {
    return this._event.parameters[0].value.toBytes();
  }

  get oldValue(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get newValue(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }
}

export class Initialized extends ethereum.Event {
  get params(): Initialized__Params {
    return new Initialized__Params(this);
  }
}

export class Initialized__Params {
  _event: Initialized;

  constructor(event: Initialized) {
    this._event = event;
  }

  get version(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }
}

export class OwnershipTransferred extends ethereum.Event {
  get params(): OwnershipTransferred__Params {
    return new OwnershipTransferred__Params(this);
  }
}

export class OwnershipTransferred__Params {
  _event: OwnershipTransferred;

  constructor(event: OwnershipTransferred) {
    this._event = event;
  }

  get previousOwner(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get newOwner(): Address {
    return this._event.parameters[1].value.toAddress();
  }
}

export class ConfigManager__getAllConfigsResult {
  value0: Array<Bytes>;
  value1: Array<BigInt>;

  constructor(value0: Array<Bytes>, value1: Array<BigInt>) {
    this.value0 = value0;
    this.value1 = value1;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set("value0", ethereum.Value.fromFixedBytesArray(this.value0));
    map.set("value1", ethereum.Value.fromUnsignedBigIntArray(this.value1));
    return map;
  }

  getKeys(): Array<Bytes> {
    return this.value0;
  }

  getValues(): Array<BigInt> {
    return this.value1;
  }
}

export class ConfigManager extends ethereum.SmartContract {
  static bind(address: Address): ConfigManager {
    return new ConfigManager("ConfigManager", address);
  }

  ARBITRATION_BTC_FEE_RATE(): Bytes {
    let result = super.call(
      "ARBITRATION_BTC_FEE_RATE",
      "ARBITRATION_BTC_FEE_RATE():(bytes32)",
      [],
    );

    return result[0].toBytes();
  }

  try_ARBITRATION_BTC_FEE_RATE(): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "ARBITRATION_BTC_FEE_RATE",
      "ARBITRATION_BTC_FEE_RATE():(bytes32)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  ARBITRATION_FROZEN_PERIOD(): Bytes {
    let result = super.call(
      "ARBITRATION_FROZEN_PERIOD",
      "ARBITRATION_FROZEN_PERIOD():(bytes32)",
      [],
    );

    return result[0].toBytes();
  }

  try_ARBITRATION_FROZEN_PERIOD(): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "ARBITRATION_FROZEN_PERIOD",
      "ARBITRATION_FROZEN_PERIOD():(bytes32)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  ARBITRATION_TIMEOUT(): Bytes {
    let result = super.call(
      "ARBITRATION_TIMEOUT",
      "ARBITRATION_TIMEOUT():(bytes32)",
      [],
    );

    return result[0].toBytes();
  }

  try_ARBITRATION_TIMEOUT(): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "ARBITRATION_TIMEOUT",
      "ARBITRATION_TIMEOUT():(bytes32)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  DAPP_BTC_FEE_PAYMENT_TIMEOUT(): Bytes {
    let result = super.call(
      "DAPP_BTC_FEE_PAYMENT_TIMEOUT",
      "DAPP_BTC_FEE_PAYMENT_TIMEOUT():(bytes32)",
      [],
    );

    return result[0].toBytes();
  }

  try_DAPP_BTC_FEE_PAYMENT_TIMEOUT(): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "DAPP_BTC_FEE_PAYMENT_TIMEOUT",
      "DAPP_BTC_FEE_PAYMENT_TIMEOUT():(bytes32)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  MAX_STAKE(): Bytes {
    let result = super.call("MAX_STAKE", "MAX_STAKE():(bytes32)", []);

    return result[0].toBytes();
  }

  try_MAX_STAKE(): ethereum.CallResult<Bytes> {
    let result = super.tryCall("MAX_STAKE", "MAX_STAKE():(bytes32)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  MAX_TRANSACTION_DURATION(): Bytes {
    let result = super.call(
      "MAX_TRANSACTION_DURATION",
      "MAX_TRANSACTION_DURATION():(bytes32)",
      [],
    );

    return result[0].toBytes();
  }

  try_MAX_TRANSACTION_DURATION(): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "MAX_TRANSACTION_DURATION",
      "MAX_TRANSACTION_DURATION():(bytes32)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  MIN_STAKE(): Bytes {
    let result = super.call("MIN_STAKE", "MIN_STAKE():(bytes32)", []);

    return result[0].toBytes();
  }

  try_MIN_STAKE(): ethereum.CallResult<Bytes> {
    let result = super.tryCall("MIN_STAKE", "MIN_STAKE():(bytes32)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  MIN_STAKE_LOCKED_TIME(): Bytes {
    let result = super.call(
      "MIN_STAKE_LOCKED_TIME",
      "MIN_STAKE_LOCKED_TIME():(bytes32)",
      [],
    );

    return result[0].toBytes();
  }

  try_MIN_STAKE_LOCKED_TIME(): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "MIN_STAKE_LOCKED_TIME",
      "MIN_STAKE_LOCKED_TIME():(bytes32)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  MIN_TRANSACTION_DURATION(): Bytes {
    let result = super.call(
      "MIN_TRANSACTION_DURATION",
      "MIN_TRANSACTION_DURATION():(bytes32)",
      [],
    );

    return result[0].toBytes();
  }

  try_MIN_TRANSACTION_DURATION(): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "MIN_TRANSACTION_DURATION",
      "MIN_TRANSACTION_DURATION():(bytes32)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  SYSTEM_COMPENSATION_FEE_RATE(): Bytes {
    let result = super.call(
      "SYSTEM_COMPENSATION_FEE_RATE",
      "SYSTEM_COMPENSATION_FEE_RATE():(bytes32)",
      [],
    );

    return result[0].toBytes();
  }

  try_SYSTEM_COMPENSATION_FEE_RATE(): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "SYSTEM_COMPENSATION_FEE_RATE",
      "SYSTEM_COMPENSATION_FEE_RATE():(bytes32)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  SYSTEM_FEE_COLLECTOR(): Bytes {
    let result = super.call(
      "SYSTEM_FEE_COLLECTOR",
      "SYSTEM_FEE_COLLECTOR():(bytes32)",
      [],
    );

    return result[0].toBytes();
  }

  try_SYSTEM_FEE_COLLECTOR(): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "SYSTEM_FEE_COLLECTOR",
      "SYSTEM_FEE_COLLECTOR():(bytes32)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  SYSTEM_FEE_RATE(): Bytes {
    let result = super.call(
      "SYSTEM_FEE_RATE",
      "SYSTEM_FEE_RATE():(bytes32)",
      [],
    );

    return result[0].toBytes();
  }

  try_SYSTEM_FEE_RATE(): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "SYSTEM_FEE_RATE",
      "SYSTEM_FEE_RATE():(bytes32)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  TRANSACTION_MIN_BTC_FEE_RATE(): Bytes {
    let result = super.call(
      "TRANSACTION_MIN_BTC_FEE_RATE",
      "TRANSACTION_MIN_BTC_FEE_RATE():(bytes32)",
      [],
    );

    return result[0].toBytes();
  }

  try_TRANSACTION_MIN_BTC_FEE_RATE(): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "TRANSACTION_MIN_BTC_FEE_RATE",
      "TRANSACTION_MIN_BTC_FEE_RATE():(bytes32)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  TRANSACTION_MIN_FEE_RATE(): Bytes {
    let result = super.call(
      "TRANSACTION_MIN_FEE_RATE",
      "TRANSACTION_MIN_FEE_RATE():(bytes32)",
      [],
    );

    return result[0].toBytes();
  }

  try_TRANSACTION_MIN_FEE_RATE(): ethereum.CallResult<Bytes> {
    let result = super.tryCall(
      "TRANSACTION_MIN_FEE_RATE",
      "TRANSACTION_MIN_FEE_RATE():(bytes32)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBytes());
  }

  getAllConfigs(): ConfigManager__getAllConfigsResult {
    let result = super.call(
      "getAllConfigs",
      "getAllConfigs():(bytes32[],uint256[])",
      [],
    );

    return new ConfigManager__getAllConfigsResult(
      result[0].toBytesArray(),
      result[1].toBigIntArray(),
    );
  }

  try_getAllConfigs(): ethereum.CallResult<ConfigManager__getAllConfigsResult> {
    let result = super.tryCall(
      "getAllConfigs",
      "getAllConfigs():(bytes32[],uint256[])",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      new ConfigManager__getAllConfigsResult(
        value[0].toBytesArray(),
        value[1].toBigIntArray(),
      ),
    );
  }

  getArbitrationBTCFeeRate(): BigInt {
    let result = super.call(
      "getArbitrationBTCFeeRate",
      "getArbitrationBTCFeeRate():(uint256)",
      [],
    );

    return result[0].toBigInt();
  }

  try_getArbitrationBTCFeeRate(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getArbitrationBTCFeeRate",
      "getArbitrationBTCFeeRate():(uint256)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getArbitrationFrozenPeriod(): BigInt {
    let result = super.call(
      "getArbitrationFrozenPeriod",
      "getArbitrationFrozenPeriod():(uint256)",
      [],
    );

    return result[0].toBigInt();
  }

  try_getArbitrationFrozenPeriod(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getArbitrationFrozenPeriod",
      "getArbitrationFrozenPeriod():(uint256)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getArbitrationTimeout(): BigInt {
    let result = super.call(
      "getArbitrationTimeout",
      "getArbitrationTimeout():(uint256)",
      [],
    );

    return result[0].toBigInt();
  }

  try_getArbitrationTimeout(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getArbitrationTimeout",
      "getArbitrationTimeout():(uint256)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getConfig(key: Bytes): BigInt {
    let result = super.call("getConfig", "getConfig(bytes32):(uint256)", [
      ethereum.Value.fromFixedBytes(key),
    ]);

    return result[0].toBigInt();
  }

  try_getConfig(key: Bytes): ethereum.CallResult<BigInt> {
    let result = super.tryCall("getConfig", "getConfig(bytes32):(uint256)", [
      ethereum.Value.fromFixedBytes(key),
    ]);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getDappBtcFeePaymentTimeout(): BigInt {
    let result = super.call(
      "getDappBtcFeePaymentTimeout",
      "getDappBtcFeePaymentTimeout():(uint256)",
      [],
    );

    return result[0].toBigInt();
  }

  try_getDappBtcFeePaymentTimeout(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getDappBtcFeePaymentTimeout",
      "getDappBtcFeePaymentTimeout():(uint256)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getSystemCompensationFeeRate(): BigInt {
    let result = super.call(
      "getSystemCompensationFeeRate",
      "getSystemCompensationFeeRate():(uint256)",
      [],
    );

    return result[0].toBigInt();
  }

  try_getSystemCompensationFeeRate(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getSystemCompensationFeeRate",
      "getSystemCompensationFeeRate():(uint256)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getSystemFeeCollector(): Address {
    let result = super.call(
      "getSystemFeeCollector",
      "getSystemFeeCollector():(address)",
      [],
    );

    return result[0].toAddress();
  }

  try_getSystemFeeCollector(): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "getSystemFeeCollector",
      "getSystemFeeCollector():(address)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  getSystemFeeRate(): BigInt {
    let result = super.call(
      "getSystemFeeRate",
      "getSystemFeeRate():(uint256)",
      [],
    );

    return result[0].toBigInt();
  }

  try_getSystemFeeRate(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getSystemFeeRate",
      "getSystemFeeRate():(uint256)",
      [],
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  owner(): Address {
    let result = super.call("owner", "owner():(address)", []);

    return result[0].toAddress();
  }

  try_owner(): ethereum.CallResult<Address> {
    let result = super.tryCall("owner", "owner():(address)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }
}

export class ConstructorCall extends ethereum.Call {
  get inputs(): ConstructorCall__Inputs {
    return new ConstructorCall__Inputs(this);
  }

  get outputs(): ConstructorCall__Outputs {
    return new ConstructorCall__Outputs(this);
  }
}

export class ConstructorCall__Inputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class InitializeCall extends ethereum.Call {
  get inputs(): InitializeCall__Inputs {
    return new InitializeCall__Inputs(this);
  }

  get outputs(): InitializeCall__Outputs {
    return new InitializeCall__Outputs(this);
  }
}

export class InitializeCall__Inputs {
  _call: InitializeCall;

  constructor(call: InitializeCall) {
    this._call = call;
  }
}

export class InitializeCall__Outputs {
  _call: InitializeCall;

  constructor(call: InitializeCall) {
    this._call = call;
  }
}

export class RenounceOwnershipCall extends ethereum.Call {
  get inputs(): RenounceOwnershipCall__Inputs {
    return new RenounceOwnershipCall__Inputs(this);
  }

  get outputs(): RenounceOwnershipCall__Outputs {
    return new RenounceOwnershipCall__Outputs(this);
  }
}

export class RenounceOwnershipCall__Inputs {
  _call: RenounceOwnershipCall;

  constructor(call: RenounceOwnershipCall) {
    this._call = call;
  }
}

export class RenounceOwnershipCall__Outputs {
  _call: RenounceOwnershipCall;

  constructor(call: RenounceOwnershipCall) {
    this._call = call;
  }
}

export class SetArbitrationBTCFeeRateCall extends ethereum.Call {
  get inputs(): SetArbitrationBTCFeeRateCall__Inputs {
    return new SetArbitrationBTCFeeRateCall__Inputs(this);
  }

  get outputs(): SetArbitrationBTCFeeRateCall__Outputs {
    return new SetArbitrationBTCFeeRateCall__Outputs(this);
  }
}

export class SetArbitrationBTCFeeRateCall__Inputs {
  _call: SetArbitrationBTCFeeRateCall;

  constructor(call: SetArbitrationBTCFeeRateCall) {
    this._call = call;
  }

  get feeRate(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SetArbitrationBTCFeeRateCall__Outputs {
  _call: SetArbitrationBTCFeeRateCall;

  constructor(call: SetArbitrationBTCFeeRateCall) {
    this._call = call;
  }
}

export class SetArbitrationFrozenPeriodCall extends ethereum.Call {
  get inputs(): SetArbitrationFrozenPeriodCall__Inputs {
    return new SetArbitrationFrozenPeriodCall__Inputs(this);
  }

  get outputs(): SetArbitrationFrozenPeriodCall__Outputs {
    return new SetArbitrationFrozenPeriodCall__Outputs(this);
  }
}

export class SetArbitrationFrozenPeriodCall__Inputs {
  _call: SetArbitrationFrozenPeriodCall;

  constructor(call: SetArbitrationFrozenPeriodCall) {
    this._call = call;
  }

  get period(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SetArbitrationFrozenPeriodCall__Outputs {
  _call: SetArbitrationFrozenPeriodCall;

  constructor(call: SetArbitrationFrozenPeriodCall) {
    this._call = call;
  }
}

export class SetArbitrationTimeoutCall extends ethereum.Call {
  get inputs(): SetArbitrationTimeoutCall__Inputs {
    return new SetArbitrationTimeoutCall__Inputs(this);
  }

  get outputs(): SetArbitrationTimeoutCall__Outputs {
    return new SetArbitrationTimeoutCall__Outputs(this);
  }
}

export class SetArbitrationTimeoutCall__Inputs {
  _call: SetArbitrationTimeoutCall;

  constructor(call: SetArbitrationTimeoutCall) {
    this._call = call;
  }

  get timeout(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SetArbitrationTimeoutCall__Outputs {
  _call: SetArbitrationTimeoutCall;

  constructor(call: SetArbitrationTimeoutCall) {
    this._call = call;
  }
}

export class SetConfigsCall extends ethereum.Call {
  get inputs(): SetConfigsCall__Inputs {
    return new SetConfigsCall__Inputs(this);
  }

  get outputs(): SetConfigsCall__Outputs {
    return new SetConfigsCall__Outputs(this);
  }
}

export class SetConfigsCall__Inputs {
  _call: SetConfigsCall;

  constructor(call: SetConfigsCall) {
    this._call = call;
  }

  get keys(): Array<Bytes> {
    return this._call.inputValues[0].value.toBytesArray();
  }

  get values(): Array<BigInt> {
    return this._call.inputValues[1].value.toBigIntArray();
  }
}

export class SetConfigsCall__Outputs {
  _call: SetConfigsCall;

  constructor(call: SetConfigsCall) {
    this._call = call;
  }
}

export class SetDappBtcFeePaymentTimeoutCall extends ethereum.Call {
  get inputs(): SetDappBtcFeePaymentTimeoutCall__Inputs {
    return new SetDappBtcFeePaymentTimeoutCall__Inputs(this);
  }

  get outputs(): SetDappBtcFeePaymentTimeoutCall__Outputs {
    return new SetDappBtcFeePaymentTimeoutCall__Outputs(this);
  }
}

export class SetDappBtcFeePaymentTimeoutCall__Inputs {
  _call: SetDappBtcFeePaymentTimeoutCall;

  constructor(call: SetDappBtcFeePaymentTimeoutCall) {
    this._call = call;
  }

  get timeout(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SetDappBtcFeePaymentTimeoutCall__Outputs {
  _call: SetDappBtcFeePaymentTimeoutCall;

  constructor(call: SetDappBtcFeePaymentTimeoutCall) {
    this._call = call;
  }
}

export class SetMaxStakeCall extends ethereum.Call {
  get inputs(): SetMaxStakeCall__Inputs {
    return new SetMaxStakeCall__Inputs(this);
  }

  get outputs(): SetMaxStakeCall__Outputs {
    return new SetMaxStakeCall__Outputs(this);
  }
}

export class SetMaxStakeCall__Inputs {
  _call: SetMaxStakeCall;

  constructor(call: SetMaxStakeCall) {
    this._call = call;
  }

  get amount(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SetMaxStakeCall__Outputs {
  _call: SetMaxStakeCall;

  constructor(call: SetMaxStakeCall) {
    this._call = call;
  }
}

export class SetMaxTransactionDurationCall extends ethereum.Call {
  get inputs(): SetMaxTransactionDurationCall__Inputs {
    return new SetMaxTransactionDurationCall__Inputs(this);
  }

  get outputs(): SetMaxTransactionDurationCall__Outputs {
    return new SetMaxTransactionDurationCall__Outputs(this);
  }
}

export class SetMaxTransactionDurationCall__Inputs {
  _call: SetMaxTransactionDurationCall;

  constructor(call: SetMaxTransactionDurationCall) {
    this._call = call;
  }

  get duration(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SetMaxTransactionDurationCall__Outputs {
  _call: SetMaxTransactionDurationCall;

  constructor(call: SetMaxTransactionDurationCall) {
    this._call = call;
  }
}

export class SetMinStakeCall extends ethereum.Call {
  get inputs(): SetMinStakeCall__Inputs {
    return new SetMinStakeCall__Inputs(this);
  }

  get outputs(): SetMinStakeCall__Outputs {
    return new SetMinStakeCall__Outputs(this);
  }
}

export class SetMinStakeCall__Inputs {
  _call: SetMinStakeCall;

  constructor(call: SetMinStakeCall) {
    this._call = call;
  }

  get amount(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SetMinStakeCall__Outputs {
  _call: SetMinStakeCall;

  constructor(call: SetMinStakeCall) {
    this._call = call;
  }
}

export class SetMinStakeLockedTimeCall extends ethereum.Call {
  get inputs(): SetMinStakeLockedTimeCall__Inputs {
    return new SetMinStakeLockedTimeCall__Inputs(this);
  }

  get outputs(): SetMinStakeLockedTimeCall__Outputs {
    return new SetMinStakeLockedTimeCall__Outputs(this);
  }
}

export class SetMinStakeLockedTimeCall__Inputs {
  _call: SetMinStakeLockedTimeCall;

  constructor(call: SetMinStakeLockedTimeCall) {
    this._call = call;
  }

  get time(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SetMinStakeLockedTimeCall__Outputs {
  _call: SetMinStakeLockedTimeCall;

  constructor(call: SetMinStakeLockedTimeCall) {
    this._call = call;
  }
}

export class SetMinTransactionDurationCall extends ethereum.Call {
  get inputs(): SetMinTransactionDurationCall__Inputs {
    return new SetMinTransactionDurationCall__Inputs(this);
  }

  get outputs(): SetMinTransactionDurationCall__Outputs {
    return new SetMinTransactionDurationCall__Outputs(this);
  }
}

export class SetMinTransactionDurationCall__Inputs {
  _call: SetMinTransactionDurationCall;

  constructor(call: SetMinTransactionDurationCall) {
    this._call = call;
  }

  get duration(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SetMinTransactionDurationCall__Outputs {
  _call: SetMinTransactionDurationCall;

  constructor(call: SetMinTransactionDurationCall) {
    this._call = call;
  }
}

export class SetSystemCompensationFeeRateCall extends ethereum.Call {
  get inputs(): SetSystemCompensationFeeRateCall__Inputs {
    return new SetSystemCompensationFeeRateCall__Inputs(this);
  }

  get outputs(): SetSystemCompensationFeeRateCall__Outputs {
    return new SetSystemCompensationFeeRateCall__Outputs(this);
  }
}

export class SetSystemCompensationFeeRateCall__Inputs {
  _call: SetSystemCompensationFeeRateCall;

  constructor(call: SetSystemCompensationFeeRateCall) {
    this._call = call;
  }

  get rate(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SetSystemCompensationFeeRateCall__Outputs {
  _call: SetSystemCompensationFeeRateCall;

  constructor(call: SetSystemCompensationFeeRateCall) {
    this._call = call;
  }
}

export class SetSystemFeeCollectorCall extends ethereum.Call {
  get inputs(): SetSystemFeeCollectorCall__Inputs {
    return new SetSystemFeeCollectorCall__Inputs(this);
  }

  get outputs(): SetSystemFeeCollectorCall__Outputs {
    return new SetSystemFeeCollectorCall__Outputs(this);
  }
}

export class SetSystemFeeCollectorCall__Inputs {
  _call: SetSystemFeeCollectorCall;

  constructor(call: SetSystemFeeCollectorCall) {
    this._call = call;
  }

  get collector(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class SetSystemFeeCollectorCall__Outputs {
  _call: SetSystemFeeCollectorCall;

  constructor(call: SetSystemFeeCollectorCall) {
    this._call = call;
  }
}

export class SetSystemFeeRateCall extends ethereum.Call {
  get inputs(): SetSystemFeeRateCall__Inputs {
    return new SetSystemFeeRateCall__Inputs(this);
  }

  get outputs(): SetSystemFeeRateCall__Outputs {
    return new SetSystemFeeRateCall__Outputs(this);
  }
}

export class SetSystemFeeRateCall__Inputs {
  _call: SetSystemFeeRateCall;

  constructor(call: SetSystemFeeRateCall) {
    this._call = call;
  }

  get rate(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SetSystemFeeRateCall__Outputs {
  _call: SetSystemFeeRateCall;

  constructor(call: SetSystemFeeRateCall) {
    this._call = call;
  }
}

export class SetTransactionMinBTCFeeRateCall extends ethereum.Call {
  get inputs(): SetTransactionMinBTCFeeRateCall__Inputs {
    return new SetTransactionMinBTCFeeRateCall__Inputs(this);
  }

  get outputs(): SetTransactionMinBTCFeeRateCall__Outputs {
    return new SetTransactionMinBTCFeeRateCall__Outputs(this);
  }
}

export class SetTransactionMinBTCFeeRateCall__Inputs {
  _call: SetTransactionMinBTCFeeRateCall;

  constructor(call: SetTransactionMinBTCFeeRateCall) {
    this._call = call;
  }

  get feeRate(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SetTransactionMinBTCFeeRateCall__Outputs {
  _call: SetTransactionMinBTCFeeRateCall;

  constructor(call: SetTransactionMinBTCFeeRateCall) {
    this._call = call;
  }
}

export class SetTransactionMinFeeRateCall extends ethereum.Call {
  get inputs(): SetTransactionMinFeeRateCall__Inputs {
    return new SetTransactionMinFeeRateCall__Inputs(this);
  }

  get outputs(): SetTransactionMinFeeRateCall__Outputs {
    return new SetTransactionMinFeeRateCall__Outputs(this);
  }
}

export class SetTransactionMinFeeRateCall__Inputs {
  _call: SetTransactionMinFeeRateCall;

  constructor(call: SetTransactionMinFeeRateCall) {
    this._call = call;
  }

  get rate(): BigInt {
    return this._call.inputValues[0].value.toBigInt();
  }
}

export class SetTransactionMinFeeRateCall__Outputs {
  _call: SetTransactionMinFeeRateCall;

  constructor(call: SetTransactionMinFeeRateCall) {
    this._call = call;
  }
}

export class TransferOwnershipCall extends ethereum.Call {
  get inputs(): TransferOwnershipCall__Inputs {
    return new TransferOwnershipCall__Inputs(this);
  }

  get outputs(): TransferOwnershipCall__Outputs {
    return new TransferOwnershipCall__Outputs(this);
  }
}

export class TransferOwnershipCall__Inputs {
  _call: TransferOwnershipCall;

  constructor(call: TransferOwnershipCall) {
    this._call = call;
  }

  get newOwner(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class TransferOwnershipCall__Outputs {
  _call: TransferOwnershipCall;

  constructor(call: TransferOwnershipCall) {
    this._call = call;
  }
}
