import { ethereum, log } from "@graphprotocol/graph-ts";
import { CompensationClaimed, CompensationWithdrawn } from "../../generated/CompensationManager/CompensationManager";
import { CompensationClaim } from "../../generated/schema";

export function handleCompensationClaimed(event: CompensationClaimed): void {
  const compensationClaim = getCompensationClaim(event.block, event.params.claimId.toHexString());
  compensationClaim.claimer = event.params.claimer.toHexString();
  compensationClaim.claimType = contractClaimTypeToString(event.params.claimType);
  compensationClaim.ethAmount = event.params.ethAmount;
  compensationClaim.totalAmount = event.params.totalAmount;
  compensationClaim.arbiter = event.params.arbitrator.toHexString();
  compensationClaim.receivedCompensationAddress = event.params.receivedCompensationAddress.toHexString();
  compensationClaim.withdrawn = false;
  compensationClaim.save();
}

export function handleCompensationWithdrawn(event: CompensationWithdrawn): void {
  const compensationClaim = getCompensationClaim(event.block, event.params.claimId.toHexString());
  compensationClaim.withdrawn = true;
  compensationClaim.ethAmount = event.params.ethAmount;
  compensationClaim.receivedCompensationAddress = event.params.receivedCompensationAddress.toHexString();
  compensationClaim.systemFee = event.params.systemFee;
  compensationClaim.excessPaymentToClaimer = event.params.excessPaymenttoClaimer;
  compensationClaim.save();
}

/**
 * Gets the existing compensation claim if any, otherwise creates a new one.
 */
function getCompensationClaim(block: ethereum.Block, id: string): CompensationClaim {
  let existingCompensationClaim = CompensationClaim.load(id);

  if (existingCompensationClaim) {
    return existingCompensationClaim;
  }

  const compensationClaim = new CompensationClaim(id);
  compensationClaim.claimType = "Unknown";
  compensationClaim.createdAt = block.timestamp.toI32();

  return compensationClaim;
}

function contractClaimTypeToString(claimType: i32): string {
  switch (claimType) {
    case 0:
      return "IllegalSignature";
    case 1:
      return "Timeout";
    case 2:
      return "FailedArbitration";
    case 3:
      return "ArbiterFee";
    default:
      log.error(`Unknown compensation claim type: ${claimType}`, []);
      return "Unknown";
  }
}