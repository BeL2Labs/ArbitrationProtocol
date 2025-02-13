const hre = require("hardhat");
const ethers = hre.ethers;
const { readConfig } = require("../helper");

async function main() {
    // Get the deployer account (or the account with owner permissions)
    const [deployer] = await ethers.getSigners();

    let transactionManagerAddress = await readConfig(hre.network.name, "TRANSACTION_MANAGER");
    // Get the addresses from config
    const compensationManagerAddress = await readConfig(hre.network.name, "COMPENSATION_MANAGER");
    console.log("compensationManagerAddress ", compensationManagerAddress);
    // Get the ArbitrationManager contract
    const CompensationManager = await ethers.getContractFactory("CompensationManager");
    const compensationManager = CompensationManager.attach(compensationManagerAddress);

    // Call setTransactionManager
    console.log(`Setting TransactionManager to ${transactionManagerAddress}...`);
    const tx = await compensationManager.connect(deployer).setTransactionManager(transactionManagerAddress);

    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    console.log(`TransactionManager set successfully. Transaction hash: ${receipt.transactionHash}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error setting TransactionManager:", error);
        process.exit(1);
    });
