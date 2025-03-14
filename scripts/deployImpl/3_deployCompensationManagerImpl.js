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

        console.log("\nDeploying CompensationManager...");
        const CompensationManager = await ethers.getContractFactory("CompensationManager", deployer);
        let implementation = await upgrades.deployImplementation(CompensationManager, {
            redeployImplementation: "onchange",
        });
        console.log("\nDeployment completed successfully! ", implementation);

    } catch (error) {
        console.error("Deployment failed!", error);
        process.exitCode = 1;
    }
}

main();
