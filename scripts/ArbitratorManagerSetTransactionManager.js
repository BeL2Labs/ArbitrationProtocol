const hre = require("hardhat");
const ethers = hre.ethers;
const { readConfig } = require("./helper");

async function main() {
    // Get the deployer account (or the account with owner permissions)
    const [deployer] = await ethers.getSigners();

    // Get the addresses from config
    const arbitorMangerAddress = await readConfig(hre.network.name, "ARBITRATOR_MANAGER");
    const transactionManagerAddress = await readConfig(hre.network.name, "TRANSACTION_MANAGER");
    console.log("arbitorMangerAddress ", arbitorMangerAddress);
    console.log("transactionManagerAddress ", transactionManagerAddress);
    // Get the ArbitrationManager contract
    const ArbitrationManager = await ethers.getContractFactory("ArbitratorManager");
    const arbitrationManager = ArbitrationManager.attach(arbitorMangerAddress);

    // Call setTransactionManager
    console.log(`Setting TransactionManager to ${transactionManagerAddress}...`);
    const tx = await arbitrationManager.connect(deployer).setTransactionManager(transactionManagerAddress);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`TransactionManager set successfully. Transaction hash: ${receipt.hash}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error setting TransactionManager:", error);
        process.exit(1);
    });
