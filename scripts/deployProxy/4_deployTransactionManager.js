const { ethers, network, getChainId } = require("hardhat");
const { sleep, writeConfig, readConfig } = require("../helper.js");
const { upgrades } = require("hardhat");
const net = require("node:net");

async function main() {
    try {
        console.log("Starting deployment...");
        const chainID = await getChainId();
        console.log("Deploying to chain ID:", chainID);
        
        const [deployer] = await ethers.getSigners();
        console.log("Deploying contracts with account:", deployer.address);
        console.log("Account balance:", ethers.utils.formatEther(await ethers.provider.getBalance(deployer.address)));

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

        const compensationManager = await readConfig(network.name, "COMPENSATION_MANAGER");
        if (!compensationManager) {
            throw new Error("compensationManager address not found.");
        }
        console.log("Using CompensationManager at:", compensationManager);

        const btc_utils = await readConfig(network.name, "BTC_UTILS");
        if (!btc_utils) {
            throw new Error("BTCUtils address not found.");
        }
        console.log("Using BTCUtils at:", btc_utils);

        const btcAddressParser = await readConfig(network.name, "BTC_ADDRESS_CONTRACT");
        if (!btcAddressParser) {
            throw new Error("BTCAddressParser address not found.");
        }
        console.log("Using BTCAddressParser at:", btcAddressParser);

        console.log("\nDeploying TransactionManager...");
        const TransactionManager = await ethers.getContractFactory("TransactionManager", deployer);
        
        const transactionManager = await upgrades.deployProxy(TransactionManager, 
            [
                arbitratorManagerAddress,
                dappRegistryAddress,
                configManagerAddress,
                compensationManager,
                btc_utils,
                btcAddressParser
            ],
            { 
                initializer: "initialize",
                timeout: 60000,
                pollingInterval: 5000,
                txOverrides: {
                    gasLimit: 5000000, // Increased gas limit
                    gasPrice: 1000000000 // 1 gwei
                }
            }
        );
        
        const contractAddress = await transactionManager.address;
        console.log("TransactionManager deployed as proxy to:", contractAddress);
        
        // Save the contract address
        await writeConfig(network.name, "TRANSACTION_MANAGER", contractAddress);
        

        console.log("\nDeployment completed successfully!");
        
    } catch (error) {
        console.error("Deployment failed!", error);
        process.exitCode = 1;
    }
}

main();
