const { ethers, network, getChainId } = require("hardhat");
const { readConfig , getBitcoinCredentials} = require("../helper.js");

async function main() {
    // 1. Environment Variable Checks
    const chainID = await getChainId();
    const [,deployer] = await ethers.getSigners();
    // 2. Network Validation
    console.log(`Chain ID: ${chainID}`);
    console.log(`Deployer address: ${deployer.address}`, "network", network.name);

    // 3. Get Contract Addresses and Parameters
    const arbitratorManagerAddress = await readConfig(network.name, "ARBITRATOR_MANAGER");
    if (!arbitratorManagerAddress) {
        throw new Error("ArbitratorManager address not found in config");
    }
    console.log("ArbitratorManager address:", arbitratorManagerAddress);

    const configManagerAddress = await readConfig(network.name, "CONFIG_MANAGER");
    if (!configManagerAddress) {
        throw new Error("ConfigManager address not found in config");
    }
    console.log("ConfigManager address:", configManagerAddress);
    const ConfigManagerFactory = await ethers.getContractFactory("ConfigManager");
    const configManager = ConfigManagerFactory.attach(configManagerAddress).connect(deployer);

    const tokenAddress = await readConfig(network.name, "NBW_TOKEN");
    if (!tokenAddress) {
        throw new Error("NBW_TOKEN address not found in config");
    }
    console.log("Token address to stake:", tokenAddress);

    const accounts = network.config.accounts;
    const privateKey = accounts[1];
    let { btcPubKey, btcAddress } = await getBitcoinCredentials(privateKey);
    const min_fee_rate = await configManager.getConfig(await configManager.TRANSACTION_MIN_FEE_RATE());
    console.log("min_fee_rate:", min_fee_rate);

    // 4. Arbitrator Registration Parameters
    const stakeAmount = ethers.utils.parseUnits("9", 18); // 10 tokens with 18 decimals
    const defaultBtcAddress = btcAddress; // Example Bitcoin address
    const defaultBtcPubKey = "0x" + btcPubKey;
    const feeRate = min_fee_rate;
    const btcFeeRate = ethers.utils.parseUnits("1", 4); // 0.1% BTC fee rate
    const deadline = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year from now

    console.log("Stake amount:", ethers.utils.formatUnits(stakeAmount, 18), "tokens");
    console.log("BTC Address:", defaultBtcAddress);
    console.log("Deadline:", new Date(deadline * 1000).toISOString());

    try {
        // 5. Contract Setup
        console.log("Using account:", deployer.address);

        const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager");
        const arbitratorManager = ArbitratorManager.attach(arbitratorManagerAddress).connect(deployer);

        // 6. Token Approval (Required before staking)
        const token = await ethers.getContractAt("IERC20", tokenAddress, deployer);
        
        const assetManagerAddress = await readConfig(network.name, "ASSET_MANAGER");
        // console.log("\nApproving token spending...");
        const approveTx = await token.approve(assetManagerAddress, stakeAmount);
        const approveReceipt = await approveTx.wait(1);
        console.log("Approval Transaction Hash:", approveReceipt.transactionHash);

        // 7. Transaction Execution
        console.log("\nRegistering Arbitrator...");
        const gasLimit = await arbitratorManager.estimateGas.registerArbitratorByStakeERC20(
            tokenAddress, 
            stakeAmount, 
            defaultBtcAddress, 
            defaultBtcPubKey, 
            feeRate, 
            btcFeeRate, 
            deadline
        );
        const tx = await arbitratorManager.registerArbitratorByStakeERC20(
            tokenAddress, 
            stakeAmount, 
            defaultBtcAddress, 
            defaultBtcPubKey, 
            feeRate, 
            btcFeeRate, 
            deadline
        );
        
        // 8. Wait for Confirmation
        console.log("Transaction hash:", tx.hash);
        const receipt = await tx.wait(1);
        
        // 9. Log Results
        console.log("Transaction confirmed in block:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed.toString());
        
        // Check for events
        const stakeAddedEvent = receipt.logs.find(
            log => log.topics[0] === arbitratorManager.interface.getEventTopic('StakeAdded')
        );
        
        const arbitratorRegisteredEvent = receipt.logs.find(
            log => log.topics[0] === arbitratorManager.interface.getEventTopic('ArbitratorRegistered')
        );
        
        if (stakeAddedEvent && arbitratorRegisteredEvent) {
            console.log("\nArbitrator successfully registered and staked!");
        } else {
            console.warn("\nWarning: Expected events not found in transaction logs");
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