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
  const [deployer] = await ethers.getSigners();
  
  // Get the contract factory
  const ConfigFactory = await ethers.getContractFactory("ConfigManager");
  
  // Get the deployed contract address from config
  const configManagerAddress = await readConfig(network.name, "CONFIG_MANAGER");
  console.log("configManagerAddress:", configManagerAddress);
  
  // Get the contract instance
  const contract = await ConfigFactory.attach(configManagerAddress);

  const MIN_STAKE = ethers.keccak256(ethers.toUtf8Bytes("MIN_STAKE"));
  const MAX_STAKE = ethers.keccak256(ethers.toUtf8Bytes("MAX_STAKE"));
  const MIN_STAKE_LOCKED_TIME = ethers.keccak256(ethers.toUtf8Bytes("MIN_STAKE_LOCKED_TIME"));
  const SYSTEM_FEE_RATE = ethers.keccak256(ethers.toUtf8Bytes("systemFeeRate"));

  const minStake = await contract.getConfig(MIN_STAKE);
  console.log("MIN_STAKE:", ethers.formatEther(minStake), "ETH");

  const maxStake = await contract.getConfig(MAX_STAKE);
  console.log("MAX_STAKE:", ethers.formatEther(maxStake), "ETH");

  const minStakeLockedTime = await contract.getConfig(MIN_STAKE_LOCKED_TIME);
  console.log("MIN_STAKE_LOCKED_TIME:", minStakeLockedTime.toString(), "seconds");

  const systemFeeRate = await contract.getConfig(SYSTEM_FEE_RATE);
  console.log("SYSTEM_FEE_RATE:", systemFeeRate.toString(), "basis points");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
