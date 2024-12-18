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

    // Transaction ID for arbitration request
    const transactionId = "0x26cade60725c3bb434232dbc160d130576f82cd63a9ff0cb8ad30c4b13bbb0d0";
    // Arbitration details
    const btcTx = "0x02000000014c0343a8a6e961895e954de82490bde6d164aef98af73f5c53c58c4aeebe87c8010000006a473044022036a1ec2f5ae4e19bbb24b657b77556436a6d024e0cb0322ad37f150cc6d33e4f02204748730fc789f13fe7c3249b64d5863b1ef92877dc9b8cc4b2937967a0b8c713012103fbcb0e8a52d8b47ea3dd5d7934abd5c7b6ab89d26ceb5abd630d7d7954a3428cffffffff022bf10200000000001976a91467f18321c68a3508233313059809e97ae91c46a388ac62ec0600000000001976a91498b08e7ef20a0563c045902d39145df4ab5a598088ac00000000";
    const timeoutCompensationReceiver = deployer.address;
    try {
        // Log transaction details
        console.log("Transaction ID for Arbitration:", transactionId);

        // Call requestArbitration
        const tx = await transactionManager.requestArbitration(
            transactionId,
            btcTx,
            timeoutCompensationReceiver,
            {
                gasLimit: 500000 // Hardcoded gas limit
            }
        );

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
