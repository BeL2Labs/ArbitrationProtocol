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

    // Transaction ID to query
    const transactionId = "0x26cade60725c3bb434232dbc160d130576f82cd63a9ff0cb8ad30c4b13bbb0d0";

    try {
        // Log transaction details
        console.log("Querying Transaction ID:", transactionId);

        // Call getTransactionById
        const transaction = await transactionManager.getTransactionById(transactionId);

        // Log the transaction details
        console.log("\n--- Transaction Details ---");
        console.log("DApp:", transaction.dapp);
        console.log("Arbitrator:", transaction.arbitrator);
        console.log("Deadline:", new Date(Number(transaction.deadline) * 1000).toUTCString());
        console.log("Deposited Fee:", ethers.formatEther(transaction.depositedFee), "ETH");
        console.log("Start Time:", new Date(Number(transaction.startTime) * 1000).toUTCString());
        console.log("Status:", getTransactionStatus(transaction.status));
        console.log("BTC Tx Hash:", transaction.btcTxHash);
        console.log("Compensation Receiver:", transaction.compensationReceiver);
        console.log("Timeout Compensation Receiver:", transaction.timeoutCompensationReceiver);

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
        3: "Arbitration Submitted",
        4: "Timeout Compensation Claimed"
    };
    return statusMap[status] || `Unknown Status (${status})`;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
