const { ethers, network , getChainId} = require("hardhat");
const { readConfig } = require("./helper.js");

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
  const compensationManagerAddress = await readConfig(network.name, "COMPENSATION_MANAGER");
  console.log("arbitratorManagerAddress", arbitratorManagerAddress);
  console.log("transactionManagerAddress", transactionManagerAddress);
  console.log("compensationManagerAddress", compensationManagerAddress);
  // Call initialize
  const tx = await arbitratorManager.initTransactionAndCompensationManager(
    transactionManagerAddress,
    compensationManagerAddress,
      { gasLimit: 2000000 }
  );
  
  // Wait for the transaction to be mined
  await tx.wait();
  
  console.log("ArbitratorManager initialized successfully!");
  console.log("Transaction hash:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
