import { BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { ArbitratorDeadlineUpdated, ArbitratorFeeRateUpdated, ArbitratorFrozen, ArbitratorPaused, ArbitratorRegistered, ArbitratorReleased, ArbitratorTerminatedWithSlash, ArbitratorUnpaused, ArbitratorWorking, OperatorSet, RevenueAddressesSet, StakeAdded, StakeWithdrawn } from "../../generated/ArbitratorManager/ArbitratorManager";
import { ArbiterInfo } from "../../generated/schema";
import { BYTES32_ZERO, ZERO_ADDRESS } from "../constants";
import { getConfigEntry } from "./ConfigManager";

export function handleArbitratorRegistered(event: ArbitratorRegistered): void {
    const arbitratorAddress = event.params.arbitrator.toHexString();
    const arbitratorInfo = getArbitratorInfo(event.block, arbitratorAddress);

    // Operator
    arbitratorInfo.operatorEvmAddress = event.params.operator.toHexString();
    arbitratorInfo.operatorBtcAddress = event.params.btcAddress;
    arbitratorInfo.operatorBtcPubKey = event.params.btcPubKey.toHexString().slice(2);
    // Revenue
    arbitratorInfo.revenueEvmAddress = event.params.revenueAddress.toHexString();
    arbitratorInfo.revenueBtcAddress = event.params.btcAddress;
    arbitratorInfo.revenueBtcPubKey = event.params.btcPubKey.toHexString().slice(2);
    // Settings
    arbitratorInfo.deadLine = event.params.deadline.toI32();
    arbitratorInfo.ethFeeRate = event.params.feeRate.toI32();
    arbitratorInfo.btcFeeRate = event.params.btcFeeRate.toI32();

    arbitratorInfo.isActive = computeIsActive(arbitratorInfo, event.block);
    arbitratorInfo.save();
}

export function handleStakeAdded(event: StakeAdded): void {
    const arbitratorAddress = event.params.arbitrator.toHexString();
    const assetAddress = event.params.assetAddress.toHexString();

    const arbitratorInfo = getArbitratorInfo(event.block, arbitratorAddress);

    if (assetAddress == ZERO_ADDRESS) {
        // Native coin staking
        arbitratorInfo.ethAmount = arbitratorInfo.ethAmount.plus(event.params.amount); // Native coin amount only
    }
    else {
        // NFT staking
        arbitratorInfo.nftValue = arbitratorInfo.nftValue.plus(event.params.amount);
        // TODO: save NFT ids
    }

    arbitratorInfo.isActive = computeIsActive(arbitratorInfo, event.block);
    arbitratorInfo.save();
}

/**
 * NOTE: withdraw operation takes out everything.
 */
export function handleStakeWithdrawn(event: StakeWithdrawn): void {
    const arbitratorInfo = getArbitratorInfo(event.block, event.params.arbitrator.toHexString());

    arbitratorInfo.ethAmount = new BigInt(0);
    arbitratorInfo.nftValue = new BigInt(0);

    // TODO: NFT

    arbitratorInfo.isActive = computeIsActive(arbitratorInfo, event.block);
    arbitratorInfo.save();
}

export function handleArbitratorDeadlineUpdated(event: ArbitratorDeadlineUpdated): void {
    const arbitratorInfo = getArbitratorInfo(event.block, event.params.arbitrator.toHexString());
    arbitratorInfo.deadLine = event.params.deadline.toI32();
    arbitratorInfo.isActive = computeIsActive(arbitratorInfo, event.block);
    arbitratorInfo.save();
}

export function handleArbitratorFeeRateUpdated(event: ArbitratorFeeRateUpdated): void {
    const arbitratorInfo = getArbitratorInfo(event.block, event.params.arbitrator.toHexString());
    arbitratorInfo.ethFeeRate = event.params.ethFeeRate.toI32();
    arbitratorInfo.btcFeeRate = event.params.btcFeeRate.toI32();
    arbitratorInfo.isActive = computeIsActive(arbitratorInfo, event.block);
    arbitratorInfo.save();
}

export function handleArbitratorPaused(event: ArbitratorPaused): void {
    const arbitratorInfo = getArbitratorInfo(event.block, event.params.arbitrator.toHexString());
    arbitratorInfo.paused = true;
    arbitratorInfo.isActive = computeIsActive(arbitratorInfo, event.block);
    arbitratorInfo.save();
}

export function handleArbitratorUnpaused(event: ArbitratorUnpaused): void {
    const arbitratorInfo = getArbitratorInfo(event.block, event.params.arbitrator.toHexString());
    arbitratorInfo.paused = false;
    arbitratorInfo.isActive = computeIsActive(arbitratorInfo, event.block);
    arbitratorInfo.save();
}

export function handleRevenueAddressesSet(event: RevenueAddressesSet): void {
    const arbitratorInfo = getArbitratorInfo(event.block, event.params.arbitrator.toHexString());
    arbitratorInfo.revenueEvmAddress = event.params.ethAddress.toHexString();
    arbitratorInfo.revenueBtcAddress = event.params.btcAddress;
    arbitratorInfo.revenueBtcPubKey = event.params.btcPubKey.toHexString().slice(2);
    arbitratorInfo.isActive = computeIsActive(arbitratorInfo, event.block);
    arbitratorInfo.save();
}

export function handleOperatorSet(event: OperatorSet): void {
    const arbitratorInfo = getArbitratorInfo(event.block, event.params.arbitrator.toHexString());
    arbitratorInfo.operatorEvmAddress = event.params.operator.toHexString();
    arbitratorInfo.operatorBtcAddress = event.params.btcAddress;
    arbitratorInfo.operatorBtcPubKey = event.params.btcPubKey.toHexString().slice(2);
    arbitratorInfo.isActive = computeIsActive(arbitratorInfo, event.block);
    arbitratorInfo.save();
}

export function handleArbitratorWorking(event: ArbitratorWorking): void {
    const arbitratorInfo = getArbitratorInfo(event.block, event.params.arbitrator.toHexString());
    arbitratorInfo.activeTransactionId = event.params.transactionId.toHexString();
    arbitratorInfo.isActive = computeIsActive(arbitratorInfo, event.block);
    arbitratorInfo.save();
}

export function handleArbitratorReleased(event: ArbitratorReleased): void {
    const arbitratorInfo = getArbitratorInfo(event.block, event.params.arbitrator.toHexString());
    arbitratorInfo.activeTransactionId = null;
    arbitratorInfo.isActive = computeIsActive(arbitratorInfo, event.block);
    arbitratorInfo.save();
}

export function handleArbitratorFrozen(event: ArbitratorFrozen): void {
    const arbitratorInfo = getArbitratorInfo(event.block, event.params.arbitrator.toHexString());
    arbitratorInfo.lastSubmittedWorkTime = event.block.timestamp.toI32();
    arbitratorInfo.isActive = computeIsActive(arbitratorInfo, event.block);
    arbitratorInfo.save();
}

export function handleArbitratorTerminatedWithSlash(event: ArbitratorTerminatedWithSlash): void {
    const arbitratorInfo = getArbitratorInfo(event.block, event.params.arbitrator.toHexString());
    arbitratorInfo.ethAmount = BigInt.fromI32(0);
    arbitratorInfo.nftValue = BigInt.fromI32(0);
    arbitratorInfo.isActive = computeIsActive(arbitratorInfo, event.block);
    arbitratorInfo.save();
}

/**
 * To be called from other event handlers to update `isActive` field of an arbitrator, for example
 * when transactions make the arbitrator status change.
 */
export function recomputeArbitratorIsActive(arbitratorAddress: string | null, block: ethereum.Block): void {
    if (!arbitratorAddress)
        return;

    const arbitrator = getArbitratorInfo(block, arbitratorAddress!);
    if (!arbitrator)
        return;

    arbitrator.isActive = computeIsActive(arbitrator, block);
    arbitrator.save();
}

/**
 * Mimics the `isActiveArbitrator` logic from the ArbitratorManager. No "isActive" event parameter 
 * can be sent from the contract so this is the only way to cache that status in the subgraph without
 * asking all client apps to multicall fetch arbiters "availability".
 * 
 * IMPORTANT: make sure to maintain this method in sync with the contract's `isActiveArbitrator` method
 * when its code changes!
 */
function computeIsActive(arbitrator: ArbiterInfo, block: ethereum.Block): boolean {
    log.info("computeIsActive deadline {}", [`${arbitrator.deadLine}`]);
    if (arbitrator.deadLine > 0 && arbitrator.deadLine <= block.timestamp.toI32())
        return false;

    const configMinStake = getConfigEntry("MIN_STAKE").value;

    const totalStakeValue = arbitrator.ethAmount.plus(arbitrator.nftValue);
    log.info("computeIsActive totalStakeValue {} {}", [totalStakeValue.toString(), configMinStake.toString()]);
    if (totalStakeValue < configMinStake)
        return false;

    // freeze lock time
    if (isFrozenArbitrator(arbitrator, block))
        return false;

    if (arbitrator.activeTransactionId)
        log.info("computeIsActive activeTransactionId {} {}", [arbitrator.activeTransactionId!, BYTES32_ZERO.toHexString()]);
    else
        log.info("computeIsActive activeTransactionId NULL {}", [BYTES32_ZERO.toHexString()]);
    if (arbitrator.activeTransactionId && arbitrator.activeTransactionId != BYTES32_ZERO.toHexString())
        return false;

    if (arbitrator.paused)
        return false;

    return true;
}

function isFrozenArbitrator(arbitrator: ArbiterInfo, block: ethereum.Block): boolean {
    const configFrozenPeriod = getConfigEntry("ARBITRATION_FROZEN_PERIOD").value;
    if (arbitrator.lastSubmittedWorkTime == 0)
        return false;

    if (arbitrator.lastSubmittedWorkTime + configFrozenPeriod.toI32() > block.timestamp.toI32())
        return true;

    return false;
}

/**
 * Gets the existing arbitrator info if any, otherwise creates a new one.
 */
function getArbitratorInfo(block: ethereum.Block, arbitratorAddress: string): ArbiterInfo {
    let existingArbitrator = ArbiterInfo.load(arbitratorAddress);

    if (existingArbitrator)
        return existingArbitrator;

    const arbitratorInfo = new ArbiterInfo(arbitratorAddress);
    arbitratorInfo.createdAt = block.timestamp.toI32();
    arbitratorInfo.address = arbitratorAddress;
    arbitratorInfo.paused = false;
    arbitratorInfo.ethAmount = new BigInt(0);
    arbitratorInfo.nftValue = new BigInt(0);
    arbitratorInfo.ethFeeRate = 0;
    arbitratorInfo.btcFeeRate = 0;

    arbitratorInfo.operatorEvmAddress = null;
    arbitratorInfo.operatorBtcAddress = null;
    arbitratorInfo.operatorBtcPubKey = null;

    arbitratorInfo.revenueEvmAddress = null;
    arbitratorInfo.revenueBtcAddress = null;
    arbitratorInfo.revenueBtcPubKey = null;

    return arbitratorInfo;
}
