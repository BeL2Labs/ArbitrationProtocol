const { ethers, network, getChainId } = require("hardhat");
const { readConfig } = require("../helper.js");

async function main() {
  const chainID = await getChainId();
  console.log("chain ID:", chainID);
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // Get the contract factory
  const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager");
  
  // Get the deployed contract address from config
  const arbitratorManagerAddress = await readConfig(network.name, "ARBITRATOR_MANAGER");
  console.log("arbitratorManagerAddress:", arbitratorManagerAddress);
  
  // Get the contract instance
  const arbitratorManager = await ArbitratorManager.attach(arbitratorManagerAddress);

  // First, let's check if we can unstake
  const canUnstake = await arbitratorManager.canUnStake(deployer.address);
  if (!canUnstake) {
    console.error("Cannot unstake at this time. The arbitrator might be handling a transaction.");
    return;
  }

  // Get current stake information before unstaking
  const arbitratorInfo = await arbitratorManager.getArbitratorInfo(deployer.address);
  console.log("\nCurrent stake information:");
  console.log("ETH Amount:", ethers.utils.formatEther(arbitratorInfo.ethAmount), "ETH");
  console.log("NFT Token IDs:", arbitratorInfo.nftTokenIds.map(id => id.toString()));

  console.log("\nInitiating unstake...");
  
  // Call unstake
  const tx = await arbitratorManager.unstake({
    gasLimit: 2000000
  });
  
  // Wait for the transaction to be mined
  console.log("Waiting for transaction to be mined...");
  const receipt = await tx.wait();
  
  console.log("\nUnstake successful!");
  console.log("Transaction hash:", tx.hash);

  // Get updated stake information
  const updatedInfo = await arbitratorManager.getArbitratorInfo(deployer.address);
  console.log("\nUpdated stake information:");
  console.log("ETH Amount:", ethers.utils.formatEther(updatedInfo.ethAmount), "ETH");
  console.log("NFT Token IDs:", updatedInfo.nftTokenIds.map(id => id.toString()));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
