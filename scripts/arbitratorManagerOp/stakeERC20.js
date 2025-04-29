const { ethers, network, getChainId } = require("hardhat");
const { readConfig } = require("../helper.js");

async function main() {
    // 1. Environment Variable Checks
    const chainID = await getChainId();
    const [deployer] = await ethers.getSigners();
    // 2. Network Validation
    console.log(`Chain ID: ${chainID}`);
    console.log(`Deployer address: ${deployer.address}`, "network", network.name);

    // 3. Get Contract Addresses and Stake Parameters
    const arbitratorManagerAddress = await readConfig(network.name, "ARBITRATOR_MANAGER");
    if (!arbitratorManagerAddress) {
        throw new Error("ArbitratorManager address not found in config");
    }
    console.log("ArbitratorManager address:", arbitratorManagerAddress);

    const tokenAddress = await readConfig(network.name, "NBW_TOKEN");
    if (!tokenAddress) {
        throw new Error("NBW_TOKEN address not found in config");
    }
    console.log("Token address to stake:", tokenAddress);

    // 4. Stake Amount Configuration
    const stakeAmount = ethers.parseUnits("100", 18); // Example: 100 tokens with 18 decimals
    console.log("Stake amount:", ethers.formatUnits(stakeAmount, 18), "tokens");

    try {
        // 5. Contract Setup
        const [deployer] = await ethers.getSigners();
        console.log("Using account:", deployer.address);

        const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager");
        const arbitratorManager = ArbitratorManager.attach(arbitratorManagerAddress);

        // 6. Token Approval (Required before staking)
        const ERC20 = await ethers.getContractFactory("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20");
        const token = ERC20.attach(tokenAddress);
        
        console.log("\nApproving token spending...");
        const approveTx = await token.approve(arbitratorManagerAddress, stakeAmount);
        const approveReceipt = await approveTx.wait(1);
        console.log("Approval Transaction Hash:", approveReceipt.hash);

        // 7. Transaction Execution
        console.log("\nStaking tokens...");
        const tx = await arbitratorManager.stakeERC20(tokenAddress, stakeAmount);
        
        // 8. Wait for Confirmation
        console.log("Transaction hash:", tx.hash);
        const receipt = await tx.wait(1);
        
        // 9. Log Results
        console.log("Transaction confirmed in block:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed.toString());
        
        // Check for StakeAdded event
        const event = receipt.logs.find(
            log => log.topics[0] === arbitratorManager.interface.getEventTopic('StakeAdded')
        );
        
        if (event) {
            console.log("\nTokens successfully staked!");
        } else {
            console.warn("\nWarning: StakeAdded event not found in transaction logs");
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