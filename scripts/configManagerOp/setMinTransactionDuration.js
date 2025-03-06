const hre = require("hardhat");
const ethers = hre.ethers;
const { readConfig } = require("../helper");
const {network} = require("hardhat");

async function main() {
    const configManagerAddress = await readConfig(network.name, "CONFIG_MANAGER"); // Replace with your ConfigManager contract address
    const configManager = await ethers.getContractAt("ConfigManager", configManagerAddress);
    const duration = 3600; // Replace with the desired minimum transaction duration

    const tx = await configManager.setMinTransactionDuration(duration);
    await tx.wait();

    console.log(`Transaction hash: ${tx.hash}`);
    console.log(`Minimum transaction duration set to ${duration} seconds`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });