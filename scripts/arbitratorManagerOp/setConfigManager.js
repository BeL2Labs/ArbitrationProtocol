const { ethers, network } = require("hardhat");
const {readConfig } = require("../helper.js");

async function main() {
    // Get the network name
    const networkName = network.name;

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Setting arbitrator parameters with account:", deployer.address);

    const arbitratorManagerAddress = await readConfig(networkName, "ARBITRATOR_MANAGER");
    if (!arbitratorManagerAddress) {
        throw new Error("arbitratorManagerAddress address not found in config");
    }

    // Create contract instance
    const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager", deployer);
    const arbitratorManager = ArbitratorManager.attach(arbitratorManagerAddress);

    const configManager = await readConfig(networkName, "CONFIG_MANAGER");
    if (!configManager) {
        throw new Error("configManager address not found in config");
    }
    const tx = await arbitratorManager.connect(deployer).setConfigManager(
        configManager,
    );

    console.log("Transaction sent. Waiting for confirmation...");
    await tx.wait();
    console.log("Transaction hash:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error setting arbitrator parameters:", error);
        process.exit(1);
    });
