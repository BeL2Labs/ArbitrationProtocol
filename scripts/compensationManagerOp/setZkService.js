const hre = require("hardhat");
const ethers = hre.ethers;
const { readConfig } = require("../helper");

async function main() {
    // Get the deployer account (or the account with owner permissions)
    const [deployer] = await ethers.getSigners();

    // Get the addresses from config
    const compensationManagerAddress = await readConfig(hre.network.name, "COMPENSATION_MANAGER");
    const zkServiceAddress = await readConfig(hre.network.name, "ZK_SERVICE");

    // Get the CompensationManager contract
    const CompensationManager = await ethers.getContractFactory("CompensationManager");
    const compensationManager = CompensationManager.attach(compensationManagerAddress);

    // Call setZkService
    console.log(`Setting ZkService to ${zkServiceAddress}...`);
    const tx = await compensationManager.connect(deployer).setZkService(zkServiceAddress);
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    console.log(`ZkService set successfully. Transaction hash: ${tx.hash}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error setting ZkService:", error);
        process.exit(1);
    });
