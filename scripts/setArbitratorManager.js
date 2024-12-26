const hre = require("hardhat");
const ethers = hre.ethers;
const { readConfig } = require("./helper");

async function main() {
    // Get the deployer account (or the account with owner permissions)
    const [deployer] = await ethers.getSigners();

    // Replace with the actual deployed TransactionManager contract address
    const transactionManagerAddress = await readConfig(hre.network.name, "TRANSACTION_MANAGER");
    
    // Replace with the actual ArbitratorManager contract address you want to set
    const arbitratorManagerAddress = await readConfig(hre.network.name, "ARBITRATOR_MANAGER");

    // Get the TransactionManager contract
    const TransactionManager = await ethers.getContractFactory("TransactionManager");
    const transactionManager = TransactionManager.attach(transactionManagerAddress);

    // Call setArbitratorManager
    console.log(`Setting ArbitratorManager to ${arbitratorManagerAddress}...`);
    let tx = await transactionManager.connect(deployer).setArbitratorManager(arbitratorManagerAddress);
    
    // Wait for the transaction to be mined
    let receipt = await tx.wait();
    
    console.log(`transactionManager ArbitratorManager set successfully. Transaction hash: ${tx.hash}`);

    const compensationManagerAddress = await readConfig(hre.network.name, "COMPENSATION_MANAGER");
    const CompensationManager = await ethers.getContractFactory("CompensationManager");
    const compensationManager = CompensationManager.attach(compensationManagerAddress);

    tx = await compensationManager.setArbitratorManager(arbitratorManagerAddress);
    receipt = await tx.wait();
    console.log(`compensationManager ArbitratorManager set successfully. Transaction hash: ${tx.hash}`);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error setting ArbitratorManager:", error);
        process.exit(1);
    });
