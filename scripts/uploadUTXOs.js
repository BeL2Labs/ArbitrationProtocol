const hre = require("hardhat");
const ethers = hre.ethers;
const { readConfig } = require("./helper");

async function main() {
    // Get the deployer account (or the account with owner permissions)
    const [deployer] = await ethers.getSigners();

    // Replace with the actual deployed TransactionManager contract address
    const transactionManagerAddress = await readConfig(hre.network.name, "TRANSACTION_MANAGER");


    // Get the TransactionManager contract
    const TransactionManager = await ethers.getContractFactory("TransactionManager");
    const transactionManager = TransactionManager.attach(transactionManagerAddress);

    // Call setArbitratorManager
    let id = "0xaa7316a181edcd611d31b5a70aeebc5edbc58d3235b4bf2d2d0085131e9bd869";
    let utxo = {
        txHash: id,
        index: 0,
        script: "0x",
        amount: 0
    }
    let gas =  await transactionManager.connect(deployer).estimateGas.uploadUTXOs(id, [utxo]);
    console.log("gas", gas);
    return;
    let tx = await transactionManager.connect(deployer).uploadUTXOs(id, [utxo]);

    // Wait for the transaction to be mined
    await tx.wait();

    console.log(`transactionManager ArbitratorManager set successfully. Transaction hash: ${tx.hash}`);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error setting ArbitratorManager:", error);
        process.exit(1);
    });
