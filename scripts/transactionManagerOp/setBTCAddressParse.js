const { ethers, network } = require("hardhat");
const { writeConfig, readConfig } = require("../helper.js");

async function main() {
    // Get the network name
    const networkName = network.name;

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Setting arbitrator parameters with account:", deployer.address);

    const transactionManagerAddress = await readConfig(networkName, "TRANSACTION_MANAGER");
    if (!transactionManagerAddress) {
        throw new Error("transactionManagerAddress address not found in config");
    }

    // Create contract instance
    const TransactionManager = await ethers.getContractFactory("TransactionManager", deployer);
    const transactionManager = TransactionManager.attach(transactionManagerAddress);

    const newBtcAddressParser = await readConfig(networkName, "BTC_ADDRESS_CONTRACT");
    if (!newBtcAddressParser) {
        throw new Error("newBtcAddressParser address not found in config");
    }
    const tx = await transactionManager.connect(deployer).setBTCAddressParser(
        newBtcAddressParser,
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
