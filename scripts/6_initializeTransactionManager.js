const hre = require("hardhat");
const { readConfig } = require("./helper.js");

async function main() {
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Initializing with account:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(await deployer.provider.getBalance(deployer.address)).toString());

    // Read contract addresses from config

    const transactionManagerAddress = await readConfig(hre.network.name, "TRANSACTION_MANAGER");
    const compensationManagerAddress = await readConfig(hre.network.name, "COMPENSATION_MANAGER");

    if (!transactionManagerAddress || !compensationManagerAddress) {
        throw new Error("Required contract addresses not found in config");
    }

    console.log("\nInitializing TransactionManager...");
    console.log("TransactionManager address:", transactionManagerAddress);
    console.log("CompensationManager address:", compensationManagerAddress);

    // Get contract instance
    const TransactionManager = await ethers.getContractFactory("TransactionManager");
    const transactionManager = TransactionManager.attach(transactionManagerAddress);

    // Initialize TransactionManager
    const tx = await transactionManager.initCompensationManager(compensationManagerAddress, {
        gasLimit: 200000
    });
    await tx.wait();

    console.log("\nTransactionManager initialized successfully!");
    console.log("Transaction hash:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
