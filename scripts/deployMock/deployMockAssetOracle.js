const { ethers, network, getChainId } = require("hardhat");
const { readConfig, writeConfig } = require("../helper.js");

async function main() {
    // 1. Environment Variable Checks
    const chainID = await getChainId();

    // 2. Network Validation
    console.log(`Deploying to network: ${network.name} (Chain ID: ${chainID})`);

    // 3. Deployer Setup
    const [deployer] = await ethers.getSigners();
    console.log('Deploying MockAssetOracle with account:', deployer.address);
    
    const balance = await deployer.getBalance();
    console.log('Account balance:', ethers.utils.formatEther(balance), 'ETH');

    try {
        // 4. Contract Deployment
        const MockAssetOracle = await ethers.getContractFactory('MockAssetOracle');
        const mockAssetOracle = await MockAssetOracle.deploy();
        
        await mockAssetOracle.deployed();
        const mockAssetOracleAddress = mockAssetOracle.address;

        console.log('MockAssetOracle deployed to:', mockAssetOracleAddress);

        // 5. Save Deployment Information
        await writeConfig(network.name, "ASSET_ORACLE", mockAssetOracleAddress);

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