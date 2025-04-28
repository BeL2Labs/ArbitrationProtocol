const { ethers, network, getChainId } = require("hardhat");
const { sleep, writeConfig, readConfig } = require("../helper.js");
const { upgrades } = require("hardhat");

async function main() {
    try {
        console.log("Starting deployment...");
        const chainID = await getChainId();
        console.log("Deploying to chain ID:", chainID);
        
        const [deployer] = await ethers.getSigners();
        console.log("Deploying contracts with account:", deployer.address);
        console.log("Account balance:", ethers.utils.formatEther(await ethers.provider.getBalance(deployer.address)));

        // Get ConfigManager address from previous deployment
        const configManagerAddress = await readConfig(network.name, "CONFIG_MANAGER");
        if (!configManagerAddress) {
            throw new Error("ConfigManager address not found. Please deploy ConfigManager first.");
        }
        console.log("Using ConfigManager at:", configManagerAddress);


        console.log("\nDeploying ArbitratorManager...");
        const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager", deployer);
        
        const arbitratorManager = await upgrades.deployProxy(ArbitratorManager, 
            [configManagerAddress], 
            { 
                initializer: "initialize",
                timeout: 60000,
                pollingInterval: 5000,
                txOverrides: {
                    gasLimit: 3000000,
                    gasPrice: 1000000000 // 1 gwei
                }
            }
        );
        
        const contractAddress = await arbitratorManager.address;
        console.log("ArbitratorManager deployed as proxy to:", contractAddress);
        
        // Save contract addresses
        await writeConfig(network.name, "ARBITRATOR_MANAGER", contractAddress);
        
        console.log("\nDeployment completed successfully! \n REMEMBER TO RUN 9_initialize_arbitrator_manager.js");
        
    } catch (error) {
        console.error("Deployment failed!", error);
        process.exitCode = 1;
    }
}

main();
