const { ethers, network, getChainId } = require("hardhat");
const { readConfig } = require("../helper.js");

// Helper function to format arbitrator status
function formatArbitratorStatus(status) {
  const statuses = ['Active', 'Working', 'Paused', 'Terminated'];
  return statuses[status] || 'Unknown';
}

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

  // Get arbitrator info for the deployer address
  const arbitratorAddress = "0x3Cf0BB575527cACf9e274a6eE879f876Dae0BC40";//deployer.address;
  console.log("\nGetting arbitrator info for address:", arbitratorAddress);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.provider.getBalance(deployer.address)).toString());
  const info = await arbitratorManager.getArbitratorBasicInfo(arbitratorAddress);
  console.log("info:", info);
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
