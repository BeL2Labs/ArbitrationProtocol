const { ethers, network } = require("hardhat");
const { readConfig } = require("./helper.js");

async function main() {
    const txId = "0x611651b62dfeae98b360574d74fe1bd8de5b51867eec96b1abb5018461cdd3f6";

    const [signer] = await ethers.getSigners();
    const compensationManagerAddress = await readConfig(network.name, "COMPENSATION_MANAGER");
    console.log("Signer Address:", signer.address);
    console.log("Network:", network.name);
    console.log("Contract Address:", compensationManagerAddress);

    const contractFactory = await ethers.getContractFactory('CompensationManager');
    const contract = contractFactory.attach(compensationManagerAddress).connect(signer);

    try {

        // Attempt to call the function and log result
        const result = await contract.claimArbitratorFee(txId, {gasLimit: 3000000});
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
