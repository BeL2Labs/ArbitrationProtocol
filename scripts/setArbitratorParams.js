const { ethers, network } = require("hardhat");
const { writeConfig, readConfig } = require("./helper.js");

async function main() {
    // Get the network name
    const networkName = network.name;

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Setting arbitrator parameters with account:", deployer.address);

    // Read the deployed ArbitratorManager address
    const arbitratorManagerAddress = await readConfig(networkName, "ARBITRATOR_MANAGER");
    if (!arbitratorManagerAddress) {
        throw new Error("ArbitratorManager address not found in config");
    }

    // Create contract instance
    const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager");
    const arbitratorManager = ArbitratorManager.attach(arbitratorManagerAddress);

    // Parameters to set
    // Note: Adjust these values according to your requirements
    const feeRate = 200;  // 2% fee rate (200 basis points)
    const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;  // 30 days from now

    // Call setArbitratorParams
    console.log(`Setting arbitrator parameters:
    - Fee Rate: ${feeRate} basis points
    - Deadline: ${new Date(deadline * 1000).toISOString()}`);

    const tx = await arbitratorManager.connect(deployer).setArbitratorParams(
        feeRate, deadline,
        {gasLimit: 1000000}
    );
    
    console.log("Transaction sent. Waiting for confirmation...");
    const receipt = await tx.wait();
    
    console.log("Arbitrator parameters set successfully!");
    console.log("Transaction hash:", receipt.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error setting arbitrator parameters:", error);
        process.exit(1);
    });
