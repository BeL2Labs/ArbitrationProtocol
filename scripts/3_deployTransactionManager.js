const { ethers, network, getChainId } = require("hardhat");
const { sleep, writeConfig, readConfig } = require("./helper.js");

async function main() {
    try {
        console.log("Starting deployment...");
        const chainID = await getChainId();
        console.log("Deploying to chain ID:", chainID);
        
        const [deployer] = await ethers.getSigners();
        console.log("Deploying contracts with account:", deployer.address);
        console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

        // Get required contract addresses from previous deployments
        const configManagerAddress = await readConfig(network.name, "CONFIG_MANAGER");
        if (!configManagerAddress) {
            throw new Error("ConfigManager address not found.");
        }
        console.log("Using ConfigManager at:", configManagerAddress);

        const dappRegistryAddress = await readConfig(network.name, "DAPP_REGISTRY");
        if (!dappRegistryAddress) {
            throw new Error("DAppRegistry address not found.");
        }
        console.log("Using DAppRegistry at:", dappRegistryAddress);

        const arbitratorManagerAddress = await readConfig(network.name, "ARBITRATOR_MANAGER");
        if (!arbitratorManagerAddress) {
            throw new Error("ArbitratorManager address not found.");
        }
        console.log("Using ArbitratorManager at:", arbitratorManagerAddress);

        console.log("\nDeploying TransactionManager...");
        const TransactionManager = await ethers.getContractFactory("TransactionManager");
        const transactionManager = await TransactionManager.deploy(
            arbitratorManagerAddress,
            dappRegistryAddress,
            configManagerAddress,
            deployer.address,
            { 
                gasLimit: 5000000  // Increased gas limit
            }
        );
        
        await transactionManager.waitForDeployment();
        const contractAddress = await transactionManager.getAddress();
        console.log("TransactionManager deployed to:", contractAddress);
        
        // Save the contract address
        await writeConfig(network.name, "TRANSACTION_MANAGER", contractAddress);
        
        console.log("\nDeployment completed successfully!");
        
    } catch (error) {
        console.error("Deployment failed!", error);
        process.exitCode = 1;
    }
}

main();