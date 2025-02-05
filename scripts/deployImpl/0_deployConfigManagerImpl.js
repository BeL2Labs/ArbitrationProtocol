const { ethers, network, upgrades, getChainId } = require("hardhat");
const { sleep, writeConfig } = require("../helper.js");


async function main() {
    try {
        console.log("Starting deployment...");
        const chainID = await getChainId();
        console.log("Deploying to chain ID:", chainID);

        const [deployer] = await ethers.getSigners();
        console.log("Deploying contracts with account:", deployer.address);
        console.log("Account balance:", ethers.utils.formatEther(await ethers.provider.getBalance(deployer.address)));

        // Get contract factory
        const ConfigManager = await ethers.getContractFactory("ConfigManager", deployer);

        let implementation = await upgrades.deployImplementation(ConfigManager, {
            redeployImplementation: "onchange",
        });
        console.log("implementation ", implementation);

    } catch (error) {
        console.error("\nDeployment failed!");
        console.error(error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
