const { ethers, network } = require("hardhat");
const { readConfig } = require("./helper.js");

async function main() {
    const txId = "0x1a1c954f3e18c81d6f127913cbbc8a5e533ad25d1dbd1e83afcd08ef981d04e5";

    const [signer] = await ethers.getSigners();
    const compensationManagerAddress = await readConfig(network.name, "COMPENSATION_MANAGER");
    console.log("Signer Address:", signer.address);
    console.log("Network:", network.name);
    console.log("Contract Address:", compensationManagerAddress);

    const contractFactory = await ethers.getContractFactory('CompensationManager');
    const contract = contractFactory.attach(compensationManagerAddress).connect(signer);

    try {
        let gasLimit = await contract.estimateGas.claimArbitratorFee(txId);
        console.log("gasLimit:", gasLimit);
        // Attempt to call the function and log result
        const result = await contract.claimArbitratorFee(txId, {gasLimit: gasLimit});
        let receipt = await result.wait();
        console.log("Transaction hash:", result.hash);

    } catch (error) {
        console.error("Contract interaction failed:", error);
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);
    }
}

main().catch((error) => {
    console.error("Script execution failed:", error);
});
