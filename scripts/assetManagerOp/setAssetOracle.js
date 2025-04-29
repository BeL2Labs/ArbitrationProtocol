const { ethers, network, getChainId } = require("hardhat");
const { readConfig } = require("../helper.js");

async function main() {
    // 1. Environment Variable Checks
    const chainID = await getChainId();
    // 2. Network Validation
    console.log(`Network: ${network.name} (Chain ID: ${chainID})`);

    // 3. Get Contract Addresses
    const assetManagerAddress = await readConfig(network.name, "ASSET_MANAGER");
    if (!assetManagerAddress) {
        throw new Error("AssetManager address not found in config");
    }
    console.log("AssetManager address:", assetManagerAddress);

    const assetOracleAddress = await readConfig(network.name, "ASSET_ORACLE");
    if (!assetOracleAddress) {
        throw new Error("AssetOracle address not found in config");
    }
    console.log("AssetOracle address:", assetOracleAddress);

    try {
        // 4. Contract Setup
        const [deployer] = await ethers.getSigners();
        console.log("Using account:", deployer.address);

        const AssetManager = await ethers.getContractFactory("AssetManager");
        const assetManager = AssetManager.attach(assetManagerAddress);

        // 5. Transaction Execution
        console.log("\nSetting AssetOracle...");
        const tx = await assetManager.setAssetOracle(assetOracleAddress);
        
        // 6. Wait for Confirmation
        console.log("Transaction hash:", tx.hash);
        const receipt = await tx.wait(1);
        
        // 7. Log Results
        console.log("Transaction confirmed in block:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed.toString());
        
        // Check for AssetOracleUpdated event
        const event = receipt.logs.find(
            log => log.topics[0] === assetManager.interface.getEventTopic('AssetOracleUpdated')
        );
        
        if (event) {
            console.log("\nAssetOracle successfully updated!");
            const parsedEvent = assetManager.interface.parseLog(event);
            console.log("New AssetOracle address:", parsedEvent.args[0]);
        } else {
            console.warn("\nWarning: AssetOracleUpdated event not found in transaction logs");
        }

    } catch (error) {
        console.error("\nError:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });