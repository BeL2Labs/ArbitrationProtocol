const { ethers, network } = require("hardhat");
const { readConfig } = require("./helper.js");

async function main() {
    let [deployer, operator] = await ethers.getSigners();
    operator = deployer;
    console.log("Deployer address:", deployer.address);
    console.log("operator address:", operator.address);

    // Get the contract factory for TransactionManager
    const TransactionManager = await ethers.getContractFactory("TransactionManager");

    // Get the transaction manager address from config
    const transactionManagerAddress = await readConfig(network.name, "TRANSACTION_MANAGER");
    console.log("Transaction Manager Address:", transactionManagerAddress);
    
    // Connect to the deployed contract
    const transactionManager = TransactionManager.attach(transactionManagerAddress).connect(operator);

    // Transaction ID for arbitration submission
    const transactionId = "0xa4081daccb992d5187d3088e4abfa495e0b2f04bb897f46ee6f57d361d82b5ea";

    // Arbitration signature
    const signature = "0x3045022100da26bd7bc69739e6745c16276845541ccc837969014aea50b6b44b447fdc84ac02203f1a3a5066b2bd1462ad2185e57f3a10d6e7d5b42156475461ad8e6d8605a6a2";

    try {
        // Log transaction details
        console.log("Transaction ID for Arbitration Submission:", transactionId);
        console.log("Signature:", signature);
        let gasLimit = await transactionManager.estimateGas.submitArbitration(transactionId, signature);
        console.log("gasLimit:", gasLimit);
        // Call submitArbitration
        const tx = await transactionManager.submitArbitration(
            transactionId,
            signature,
            {
                gasLimit: gasLimit // Hardcoded gas limit
            }
        );

        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        // Log the transaction details
        console.log("Arbitration submitted successfully!");
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
        console.error("Error submitting arbitration:", error);
        
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
