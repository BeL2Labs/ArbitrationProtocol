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

    // Parameters for registerTransaction
    const arbitratorAddress = deployer.address;
    const compensationReceiverAddress = deployer.address;
    const deadline = Math.floor(Date.now() / 1000) + 3600 * 24 * 30; // 30 days from now

    try {
        // Log detailed transaction parameters
        console.log("Transaction Parameters:");
        console.log("Arbitrator Address:", arbitratorAddress);
        console.log("Compensation Receiver Address:", compensationReceiverAddress);
        console.log("Deadline:", deadline);

        // Call registerTransaction directly with transaction options
        const tx = await transactionManager.registerTransaction(
            arbitratorAddress, 
            deadline, 
            compensationReceiverAddress,
            {
                value: ethers.parseEther("0.1"),
                gasLimit: 500000 // Hardcoded gas limit
            }
        );

        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        // Log the transaction details
        console.log("Transaction registered successfully!");
        console.log("Transaction Hash:", tx.hash);
        console.log("Block Number:", receipt.blockNumber);
        
        // Check if there are any events
        if (receipt.logs && receipt.logs.length > 0) {
            console.log("Transaction Logs:", receipt.logs);
            
            // Try to parse events
            receipt.logs.forEach((log, index) => {
                try {
                    const parsedLog = transactionManager.interface.parseLog(log);
                    console.log(`Parsed Event ${index}:`, parsedLog);
                } catch (parseError) {
                    console.error(`Error parsing event ${index}:`, parseError);
                }
            });
        }
    } catch (error) {
        console.error("Error registering transaction:", error);
        
        // Detailed error logging
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        
        // If it's a revert error, try to decode the reason
        if (error.code === 'ACTION_REJECTED' || error.code === 'CALL_EXCEPTION') {
            try {
                const errorInterface = transactionManager.interface;
                const errorDescription = errorInterface.decodeErrorResult(error.data);
                console.error("Decoded Error:", errorDescription);
            } catch (decodeError) {
                console.error("Could not decode error:", decodeError);
            }
        }
        
        // Additional error context
        console.error("Full Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
