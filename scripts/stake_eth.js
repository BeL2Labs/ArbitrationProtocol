const { ethers, network, getChainId } = require("hardhat");
const { readConfig } = require("./helper.js");

async function main() {
  const chainID = await getChainId();
  console.log("chain ID:", chainID);
  const [deployer, operator] = await ethers.getSigners();
  // Get the contract factory
  const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager");
  
  // Get the deployed contract address from config
  const arbitratorManagerAddress = await readConfig(network.name, "ARBITRATOR_MANAGER");
  console.log("arbitratorManagerAddress:", arbitratorManagerAddress);
  
  // Get the contract instance
  const arbitratorManager = await ArbitratorManager.attach(arbitratorManagerAddress).connect(deployer);

  // Amount of ETH to stake (in wei)
  const stakeAmount = ethers.parseEther("1.0"); // Staking 1 ETH, adjust as needed
  console.log("Staking amount:", ethers.formatEther(stakeAmount), "ETH");

  // Call stakeETH with the specified amount
  const tx = await arbitratorManager.stakeETH({
    value: stakeAmount,
    gasLimit: 2000000
  });
  
  // Wait for the transaction to be mined
  await tx.wait();
  
  console.log("Successfully staked ETH!");
  console.log("Transaction hash:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
