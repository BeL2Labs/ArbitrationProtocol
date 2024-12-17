const { ethers, network, getChainId } = require("hardhat");
const { sleep, writeConfig, readConfig } = require("./helper.js");
const { upgrades } = require("hardhat");

async function main() {
    try {
        console.log("Starting deployment...");
        const chainID = await getChainId();
        console.log("Deploying to chain ID:", chainID);
        
        const [deployer] = await ethers.getSigners();
        console.log("Deploying contracts with account:", deployer.address);
        console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

        // Get ConfigManager address from previous deployment
        const configManagerAddress = await readConfig(network.name, "CONFIG_MANAGER");
        if (!configManagerAddress) {
            throw new Error("ConfigManager address not found. Please deploy ConfigManager first.");
        }
        console.log("Using ConfigManager at:", configManagerAddress);

        // Check if a previous deployment exists
        
        const DAppRegistry = await ethers.getContractFactory("DAppRegistry");
        
        console.log("Deploying new DAppRegistry");
        let dappRegistry = await upgrades.deployProxy(DAppRegistry, 
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
        await dappRegistry.waitForDeployment();
        console.log("DAppRegistry deployed as proxy");
        
        const contractAddress = await dappRegistry.getAddress();
        console.log("DAppRegistry address:", contractAddress);
        
        // Save the contract address
        await writeConfig(network.name, "DAPP_REGISTRY", contractAddress);
        
        // Verify the implementation address for upgradeable contract
        const implementationAddress = await upgrades.erc1967.getImplementationAddress(contractAddress);
        console.log("Implementation address:", implementationAddress);
        
        console.log("\nDeployment/Upgrade completed successfully!");
        
    } catch (error) {
        console.error("Deployment failed!", error);
        process.exitCode = 1;
    }
}

main();