const hre = require("hardhat");
const { ethers, network } = hre;
const { readConfig } = require("./helper.js");

async function main() {
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Setting Arbitration Frozen Period with account:", deployer.address);

    // Replace with the actual deployed ConfigManager address
    const configManagerAddress = await readConfig(network.name, "CONFIG_MANAGER");
    
    // The period you want to set (in seconds)
    const frozenPeriod = 10;//60 * 30; // Example: 1 day (24 * 60 * 60)

    // Get the ConfigManager contract
    const ConfigManager = await ethers.getContractFactory("ConfigManager");
    const configManager = ConfigManager.attach(configManagerAddress);

    // Call the setArbitrationFrozenPeriod method
    const tx = await configManager.connect(deployer).setArbitrationFrozenPeriod(frozenPeriod);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`Arbitration Frozen Period set to ${frozenPeriod} seconds`);
    console.log(`Transaction hash: ${receipt.transactionHash}`);

    console.log(`Arbitration Frozen Period: ${await configManager.getArbitrationFrozenPeriod()}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
