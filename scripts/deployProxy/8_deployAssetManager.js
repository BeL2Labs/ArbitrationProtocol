const { ethers, network, getChainId, upgrades } = require("hardhat");
const { writeConfig, readConfig } = require("../helper.js");

async function main() {
  // 1. Environment Variable Checks
  const chainID = await getChainId();
  console.log("Deploying to chain ID:", chainID);

  // 2. Network Validation
  console.log(`Deploying to network: ${network.name} (Chain ID: ${chainID})`);

  // 3. Deployer Setup
  const [deployer] = await ethers.getSigners();
  console.log('Deploying AssetManager with account:', deployer.address);
  
  const balance = await deployer.getBalance();
  console.log('Account balance:', ethers.utils.formatEther(balance), 'ETH');

  // 4. Dependency Address Retrieval
  const arbitratorManagerAddress = await readConfig(network.name, "ARBITRATOR_MANAGER");
  if (!arbitratorManagerAddress) {
    throw new Error("ArbitratorManager address not found. Please deploy ArbitratorManager first.");
  }
  console.log("Using ArbitratorManager at:", arbitratorManagerAddress);

  const nftContractAddress = await readConfig(network.name, "ERC721_ADDRESS");
  if (!nftContractAddress) {
    throw new Error("ERC721 address not found. Please deploy ERC721 first.");
  }
  console.log("Using ERC721 at:", nftContractAddress);

  const nftInfoAddress = await readConfig(network.name, "BNFT_INFO");
  if (!nftInfoAddress) {
    throw new Error("BNFTInfo address not found. Please deploy BNFTInfo first.");
  }
  console.log("Using BNFTInfo at:", nftInfoAddress);

  const assetOracleAddress = await readConfig(network.name, "ASSET_ORACLE");
  if (!assetOracleAddress) {
    throw new Error("AssetOracle address not found. Please deploy AssetOracle first.");
  }
  console.log("Using AssetOracle at:", assetOracleAddress);

  const tokenWhitelistAddress = await readConfig(network.name, "TOKEN_WHITELIST");
  if (!tokenWhitelistAddress) {
    throw new Error("TokenWhitelist address not found. Please deploy TokenWhitelist first.");
  }
  console.log("Using TokenWhitelist at:", tokenWhitelistAddress);

  // 5. Contract Deployment
  const AssetManager = await ethers.getContractFactory('AssetManager', deployer);
  
  try {
    const assetManager = await upgrades.deployProxy(AssetManager, 
      [
        arbitratorManagerAddress, 
        nftContractAddress,
        nftInfoAddress,
        assetOracleAddress,
        tokenWhitelistAddress
    ], 
      {
        initializer: 'initialize'
      }
    );
    
    await assetManager.deployed();
    const assetManagerAddress = await assetManager.address;

    console.log('AssetManager deployed to:', assetManagerAddress);

    // 7. Save Deployment Information
    await writeConfig(network.name, "ASSET_MANAGER", assetManagerAddress);

    console.log("\nDeployment completed successfully!");

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