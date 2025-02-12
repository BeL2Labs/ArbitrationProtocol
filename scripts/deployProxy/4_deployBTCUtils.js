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


        const BTCUtils = await ethers.getContractFactory("BTCUtils", deployer);
        
        let btcUtils = await BTCUtils.deploy();
        console.log("BTCUtils deployed to:", btcUtils.address);
        await btcUtils.deployed();

        // Save the contract address
        await writeConfig(network.name, "BTC_UTILS", btcUtils.address);
        
        console.log("Deployment completed successfully!");
        
    } catch (error) {
        console.error("Deployment failed!", error);
        process.exitCode = 1;
    }
}

main();