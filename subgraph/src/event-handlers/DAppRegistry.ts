import { ethereum } from "@graphprotocol/graph-ts";
import { DAppAuthorized, DAppDeregistered, DAppRegistered, DAppSuspended } from "../../generated/DAppRegistry/DAppRegistry";
import { DApp } from "../../generated/schema";

export function handleDAppAuthorized(event: DAppAuthorized): void {
  const dAppAddress = event.params.dapp.toHexString();
  const dApp = getDApp(event.block, dAppAddress);
  dApp.status = "Active";
  dApp.save();
}

export function handleDAppDeregistered(event: DAppDeregistered): void {
  const dAppAddress = event.params.dapp.toHexString();
  const dApp = getDApp(event.block, dAppAddress);
  dApp.status = "Terminated";
  dApp.save();
}

export function handleDAppRegistered(event: DAppRegistered): void {
  const dAppAddress = event.params.dapp.toHexString();
  const dApp = getDApp(event.block, dAppAddress);
  dApp.status = "Pending";
  dApp.owner = event.params.owner.toHexString();
  dApp.save();
}

export function handleDAppSuspended(event: DAppSuspended): void {
  const dAppAddress = event.params.dapp.toHexString();
  const dApp = getDApp(event.block, dAppAddress);
  dApp.status = "Suspended";
  dApp.save();
}

/**
 * Gets the existing dapp if any, otherwise creates a new one.
 */
function getDApp(block: ethereum.Block, id: string): DApp {
  let existingDApp = DApp.load(id);

  if (existingDApp) {
    return existingDApp;
  }

  const dapp = new DApp(id);
  dapp.address = id;
  dapp.createdAt = block.timestamp.toI32();
  dapp.status = "None";

  return dapp;
}
