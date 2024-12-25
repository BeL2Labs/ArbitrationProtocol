const hre = require("hardhat");
const ethers = hre.ethers;
const { readConfig } = require("./helper");

async function main() {
    // Get the deployer account (or the account with owner permissions)
    const [deployer] = await ethers.getSigners();

    // Get the addresses from config
    const compensationManagerAddress = await readConfig(hre.network.name, "COMPENSATION_MANAGER");
    const configManagerAddress = await readConfig(hre.network.name, "CONFIG_MANAGER");

    // Get the CompensationManager contract
    const CompensationManager = await ethers.getContractFactory("CompensationManager");
    const compensationManager = CompensationManager.attach(compensationManagerAddress);

    // Call setConfigManager
    console.log(`Setting ConfigManager to ${configManagerAddress}...`);
    const tx = await compensationManager.connect(deployer).setConfigManager(configManagerAddress);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`ConfigManager set successfully. Transaction hash: ${receipt.hash}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error setting ConfigManager:", error);
        process.exit(1);
    });
