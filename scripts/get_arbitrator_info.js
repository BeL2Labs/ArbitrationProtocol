const { ethers, network, getChainId } = require("hardhat");
const { readConfig } = require("./helper.js");

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
  const arbitratorAddress = deployer.address;
  console.log("\nGetting arbitrator info for address:", arbitratorAddress);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.provider.getBalance(deployer.address)).toString());
  const info = await arbitratorManager.getArbitratorInfo(arbitratorAddress);
  console.log("info:", info);
  // Format and display the information
  console.log("\nArbitrator Information:");
  console.log("------------------------");
  console.log("Arbitrator Address:", info.arbitrator);
  console.log("Current Fee Rate:", info.currentFeeRate.toString(), "basis points");
  console.log("ETH Stake Amount:", ethers.utils.formatEther(info.ethAmount), "ETH");
  console.log("Active Transaction ID:", info.activeTransactionId);
  console.log("Operator Address:", info.operator);
  console.log("Operator BTC Public Key:", info.operatorBtcPubKey);
  console.log("Operator BTC Address:", info.operatorBtcAddress);
  console.log("Last Arbitration Time:", new Date(Number(info.deadLine) * 1000).toLocaleString());
  console.log("NFT Contract:", info.nftContract);
  console.log("NFT Token IDs:", info.nftTokenIds.map(id => id.toString()));

  // Get additional information
  const isActive = await arbitratorManager.isActiveArbitrator(arbitratorAddress);
  const availableStake = await arbitratorManager.getAvailableStake(arbitratorAddress);
  const isConfigModifiable = await arbitratorManager.isConfigModifiable(arbitratorAddress);
  const isPaused = await arbitratorManager.isPaused(arbitratorAddress);

  console.log("\nAdditional Status:");
  console.log("------------------------");
  console.log("Is Active Arbitrator:", isActive);
  console.log("Available Stake:", ethers.utils.formatEther(availableStake), "ETH");
  console.log("IsConfigModifiable:", isConfigModifiable);
  console.log("Is Paused:", isPaused);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
