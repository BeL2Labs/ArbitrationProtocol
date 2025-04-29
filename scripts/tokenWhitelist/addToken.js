const { ethers, network, getChainId } = require("hardhat");
const { readConfig } = require("../helper.js");

async function main() {
    // 1. Environment Variable Checks
    const chainID = await getChainId();
    const [deployer] = await ethers.getSigners();

    // 2. Network Validation
    console.log(`Chain ID: ${chainID}`);
    console.log(`Deployer address: ${deployer.address}`, "network", network.name);
    // 3. Get Contract and Token Addresses
    const tokenWhitelistAddress = await readConfig(network.name, "TOKEN_WHITELIST");
    if (!tokenWhitelistAddress) {
        throw new Error("TokenWhitelist address not found in config");
    }
    console.log("TokenWhitelist address:", tokenWhitelistAddress);

    const tokenAddress = await readConfig(network.name, "NBW_TOKEN");
    if (!tokenAddress) {
        throw new Error("NBW_TOKEN address not found in config");
    }
    console.log("Token address to whitelist:", tokenAddress);

    try {
        // 4. Contract Setup

        const TokenWhitelist = await ethers.getContractFactory("TokenWhitelist");
        const tokenWhitelist = TokenWhitelist.attach(tokenWhitelistAddress);

        // 5. Transaction Execution
        console.log("\nAdding token to whitelist...");
        const tx = await tokenWhitelist.addToken(tokenAddress);
        
        // 6. Wait for Confirmation
        console.log("Transaction hash:", tx.hash);
        const receipt = await tx.wait(1);
        
        // 7. Log Results
        console.log("Transaction confirmed in block:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed.toString());
        
        // Check for TokenAdded event
        const event = receipt.logs.find(
            log => log.topics[0] === tokenWhitelist.interface.getEventTopic('TokenAdded')
        );
        
        if (event) {
            console.log("\nToken successfully added to whitelist!");
        } else {
            console.warn("\nWarning: TokenAdded event not found in transaction logs");
        }

    } catch (error) {
        if (error.message.includes("Token already whitelisted")) {
            console.error("\nError: Token is already in the whitelist");
        } else {
            console.error("\nError:", error.message);
        }
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });