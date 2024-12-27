// Before running this script:
// 1. Deploy your contracts and get their addresses
// 2. Update .env file with:
//    TRANSACTION_MANAGER_ADDRESS=<deployed_transaction_manager_address>
//    ARBITRATOR_ADDRESS=<deployed_arbitrator_address>
// 3. Run the script with: npx hardhat run scripts/getTransactionFee.js --network <your_network>

const hre = require("hardhat");
const { readConfig } = require("./helper");

async function main() {
    // Get the current block timestamp
    const currentBlock = await hre.ethers.provider.getBlock('latest');
    const currentTimestamp = currentBlock.timestamp;

    // Set a deadline 30 days from now
    const deadline = currentTimestamp + (30 * 24 * 60 * 60); // 30 days in seconds
    const arbitrationMangerAddress = await readConfig(hre.network.name, "ARBITRATOR_MANAGER");
    // Get the deployed TransactionManager contract
    const arbitratorManager = await hre.ethers.getContractAt(
        "ArbitratorManager", 
        arbitrationMangerAddress
    );
    let [account] = await hre.ethers.getSigners();
    

    try {
        // Call the getRegisterTransactionFee function
        const transactionManager = await arbitratorManager.transactionManager();
        
        console.log("transactionManager:", transactionManager);
    } catch (error) {
        console.error("Error calculating transaction fee:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
