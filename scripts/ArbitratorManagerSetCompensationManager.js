const { ethers } = require("hardhat");
const { readConfig } = require("./helper");

async function main() {
    // Get the deployer account (or the account with owner permissions)
    const [deployer] = await ethers.getSigners();

    // Get the addresses from config
    const arbitratorManagerAddress = await readConfig(hre.network.name, "ARBITRATOR_MANAGER");
    const compensationManagerAddress = await readConfig(hre.network.name, "COMPENSATION_MANAGER");

    // Get the ArbitratorManager contract
    const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager");
    const arbitratorManager = ArbitratorManager.attach(arbitratorManagerAddress);

    // Call setCompensationManager
    console.log(`Setting CompensationManager to ${compensationManagerAddress}...`);
    const tx = await arbitratorManager.connect(deployer).setCompensationManager(compensationManagerAddress);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`CompensationManager set successfully. Transaction hash: ${receipt.hash}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

module.exports = main;