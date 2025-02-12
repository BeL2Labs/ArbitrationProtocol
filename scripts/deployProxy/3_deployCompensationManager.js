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

        // Get required contract addresses from previous deployments
        const zkServiceAddress = await readConfig(network.name, "ZK_SERVICE");
        if (!zkServiceAddress) {
            throw new Error("ZkService address not found.");
        }
        console.log("Using ZkService at:", zkServiceAddress);

        const configManagerAddress = await readConfig(network.name, "CONFIG_MANAGER");
        if (!configManagerAddress) {
            throw new Error("ConfigManager address not found.");
        }
        console.log("Using ConfigManager at:", configManagerAddress);

        const arbitratorManagerAddress = await readConfig(network.name, "ARBITRATOR_MANAGER");
        if (!arbitratorManagerAddress) {
            throw new Error("ArbitratorManager address not found.");
        }
        console.log("Using ArbitratorManager at:", arbitratorManagerAddress);

        const transactionManagerAddress = await readConfig(network.name, "TRANSACTION_MANAGER");
        if (!transactionManagerAddress) {
            throw new Error("TransactionManager address not found.");
        }
        console.log("Using TransactionManager at:", transactionManagerAddress);

        const signatureValidationService = await readConfig(network.name, "SIGNATURE_VALIDATION_SERVICE");
        if (!signatureValidationService) {
            throw new Error("SignatureValidationService address not found.");
        }
        console.log("Using SignatureValidationService at:", signatureValidationService);

        console.log("\nDeploying CompensationManager...");
        const CompensationManager = await ethers.getContractFactory("CompensationManager", deployer);
        const compensationManager = await upgrades.deployProxy(CompensationManager, 
            [zkServiceAddress, configManagerAddress, arbitratorManagerAddress, signatureValidationService],
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
        
        const contractAddress = await compensationManager.address;
        console.log("CompensationManager deployed as proxy to:", contractAddress);
        
        // Save the contract address
        await writeConfig(network.name, "COMPENSATION_MANAGER", contractAddress);
        
        console.log("\nDeployment completed successfully!");
        
    } catch (error) {
        console.error("Deployment failed!", error);
        process.exitCode = 1;
    }
}

main();
