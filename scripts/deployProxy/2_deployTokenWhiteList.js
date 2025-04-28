const { ethers, network, getChainId } = require("hardhat");
const { writeConfig } = require("../helper.js");

async function main() {
  // 1. Environment Variable Checks
  const chainID = await getChainId();
  // 2. Network Validation
  console.log(`Deploying to network: ${network.name} (Chain ID: ${chainID})`);

  // 3. Deployer Setup
  const [deployer] = await ethers.getSigners();
  console.log('Deploying TokenWhitelist with account:', deployer.address);
  
  const balance = await deployer.getBalance();
  console.log('Account balance:', ethers.utils.formatEther(balance), 'ETH');

  // 4. Contract Deployment
  const TokenWhitelist = await ethers.getContractFactory('TokenWhitelist');
  
  try {
    const tokenWhitelist = await TokenWhitelist.deploy();
   
    const tokenWhitelistAddress = tokenWhitelist.address;

    console.log('TokenWhitelist deployed to:', tokenWhitelistAddress);

    // 5. Transaction Confirmation and Block Details
    await tokenWhitelist.deployed(); // Wait for 1 block confirmation

    // 6. Save Deployment Information
    await writeConfig(network.name, "TOKEN_WHITELIST", tokenWhitelistAddress);

  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });