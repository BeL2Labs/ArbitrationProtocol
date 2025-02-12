const { ethers, network } = require("hardhat");
const { readConfig } = require("./helper.js");

async function main() {
    let [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    // Get the contract factory for TransactionManager
    const TransactionManager = await ethers.getContractFactory("TransactionManager");

    // Get the transaction manager address from config
    const transactionManagerAddress = await readConfig(network.name, "TRANSACTION_MANAGER");
    console.log("Transaction Manager Address:", transactionManagerAddress);
    
    // Connect to the deployed contract
    const transactionManager = TransactionManager.attach(transactionManagerAddress);
    let arbitratorManagerAddress = await transactionManager.arbitratorManager();
    console.log("arbitratorManagerAddress", arbitratorManagerAddress);

    // Transaction ID to query
    const transactionId = "0x2ee768abbf8e8f43a181667530642555d025930652132919990222684e1349ad";

    try {
        // Log transaction details
        console.log("Querying Transaction ID:", transactionId);

        // Call getTransactionById
        const transaction = await transactionManager.getTransactionById(transactionId);
        const status = await transactionManager.getTransactionStatus(transactionId);
        // Log the transaction details
        console.log("\n--- Transaction Details ---");
        console.log("DApp:", transaction.dapp);
        console.log("Arbitrator:", transaction.arbitrator);
        console.log("Deadline:", new Date(Number(transaction.deadline) * 1000).toUTCString());
        console.log("Deadline:", transaction.deadline);
        console.log("Deposited Fee:", ethers.utils.formatEther(transaction.depositedFee), "ETH");
        console.log("Start Time:", new Date(Number(transaction.startTime) * 1000).toUTCString());
        console.log("Status:", getTransactionStatus(transaction.status));
        console.log("Status:", getTransactionStatus(status));
        console.log("BTC Tx Hash:", transaction.btcTxHash);
        console.log("Compensation Receiver:", transaction.compensationReceiver);
        console.log("Timeout Compensation Receiver:", transaction.timeoutCompensationReceiver);
        console.log("Refound Address:", transaction.depositedFeeRefundAddress);
        console.log("UTXOs:", transaction.utxos);
        // Additional parsing of transaction data
        if (transaction.btcTx && transaction.btcTx.length > 0) {
            console.log("BTC Tx Data:", transaction.btcTx);
        }
        if (transaction.signature && transaction.signature.length > 0) {
            console.log("Signature:", transaction.signature);
        }
    } catch (error) {
        console.error("Error retrieving transaction:", error);
        
        // Detailed error logging
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        
        // Additional error context
        console.error("Full Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
}

// Helper function to convert transaction status to readable string
function getTransactionStatus(status) {
    const statusMap = {
        0: "Active",
        1: "Completed",
        2: "Arbitration Requested",
        3: "Expired",
        4: "Timeout Compensation Claimed",
        5: "Submitted",
    };
    return statusMap[status] || `Unknown Status (${status})`;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
