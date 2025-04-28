const { ethers, network , getChainId} = require("hardhat");
const { readConfig } = require("../helper.js");

async function main() {
  const chainID = await getChainId();
  console.log("chain ID:", chainID);
  // Get the contract factory
  const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager");
  
  // Get the deployed contract address - replace with your deployed contract address
  const arbitratorManagerAddress = await readConfig(network.name, "ARBITRATOR_MANAGER");
  
  // Get the contract instance
  const arbitratorManager = await ArbitratorManager.attach(arbitratorManagerAddress);
  
  // Replace these addresses with your actual addresses
  const transactionManagerAddress = await readConfig(network.name, "TRANSACTION_MANAGER");
  if (!transactionManagerAddress) {
    throw new Error("TransactionManager address not found");
  }
  const compensationManagerAddress = await readConfig(network.name, "COMPENSATION_MANAGER");
  if (!compensationManagerAddress) {
    throw new Error("CompensationManager address not found");
  }
  const assetManagerAddress = await readConfig(network.name, "ASSET_MANAGER");
  if (!assetManagerAddress) {
    throw new Error("AssetManager address not found");
  }
  console.log("arbitratorManagerAddress", arbitratorManagerAddress);
  console.log("transactionManagerAddress", transactionManagerAddress);
  console.log("compensationManagerAddress", compensationManagerAddress);
  // Call initialize
  const tx = await arbitratorManager.setTransactionManager(transactionManagerAddress);
  await tx.wait();
  console.log("TransactionManager set successfully. Transaction hash: ", tx.hash);
  
  const tx2 = await arbitratorManager.setCompensationManager(compensationManagerAddress);
  await tx2.wait();
  console.log("CompensationManager set successfully. Transaction hash: ", tx2.hash);
  
  const tx3 = await arbitratorManager.setAssetManager(assetManagerAddress);
  await tx3.wait();
  console.log("AssetManager set successfully. Transaction hash: ", tx3.hash);

  console.log("ArbitratorManager initialized successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
