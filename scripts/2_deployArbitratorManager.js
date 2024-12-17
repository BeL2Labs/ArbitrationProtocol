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

        const nftAddress = await readConfig(network.name, "ERC721_ADDRESS");
        console.log("nftAddress:", nftAddress);

        const nftInfoAddress = await readConfig(network.name, "BNFT_INFO");
        console.log("nftInfoAddress:", nftInfoAddress);

        console.log("\nDeploying ArbitratorManager...");
        const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager");
        
        const arbitratorManager = await upgrades.deployProxy(ArbitratorManager, 
            [configManagerAddress, nftAddress, nftInfoAddress], 
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
        
        await arbitratorManager.waitForDeployment();
        const contractAddress = await arbitratorManager.getAddress();
        console.log("ArbitratorManager deployed as proxy to:", contractAddress);
        
        // Save contract addresses
        await writeConfig(network.name, "ARBITRATOR_MANAGER", contractAddress);
        
        // Verify the implementation address for upgradeable contract
        const implementationAddress = await upgrades.erc1967.getImplementationAddress(contractAddress);
        console.log("Implementation address:", implementationAddress);
        
        console.log("\nDeployment completed successfully!");
        
    } catch (error) {
        console.error("Deployment failed!", error);
        process.exitCode = 1;
    }
}

main();
