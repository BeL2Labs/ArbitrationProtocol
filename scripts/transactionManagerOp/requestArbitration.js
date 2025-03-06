const { ethers, network } = require("hardhat");
const { readConfig } = require("../helper.js");

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

    // Transaction ID for arbitration request
    const transactionId = "0xf27cf083281e34b8e74f401424745ac1cb560597cc6a70fe38a5fabe2c316181";
    // Arbitration details
    const btcTx = "0x0200000001965afbd2273745e1e201865b5d2e1eebc5908edb395c2f9a2559775f93799fb7010000006b483045022100b3c99f84a9e6eeb88f9a771a5bde45d270f611010992afa2c9cc0b8af9bd43ef02201db25c2bb6313de4cee959c87608271ae62a719df477f7649e1ddc932b423bc30121036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ffffffff0232570000000000002200209c69a491e7f560001fa8d9fd17508131d7d4f055711445fe62c11734043ab7845b410100000000001976a914cb539f4329eeb589e83659c8304bcc6c99553a9688ac00000000";
    const timeoutCompensationReceiver = deployer.address;
    try {
        // Log transaction details
        console.log("Transaction ID for Arbitration:", transactionId);

        // 构造仲裁请求数据结构
        const arbitrationData = {
            id: transactionId,
            rawData: btcTx,
            signDataType: 0, // 对应SignDataType.Witness
            signHashFlag: 0, // Default hash flag
            script: "", // Default unlock script
            timeoutCompensationReceiver: timeoutCompensationReceiver
        };

        // Call requestArbitration
        const tx = await transactionManager.requestArbitration(arbitrationData);

        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        // Log the transaction details
        console.log("Arbitration requested successfully!");
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
        console.error("Error requesting arbitration:", error);
        
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
