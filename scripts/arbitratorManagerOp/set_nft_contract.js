const { ethers, network } = require("hardhat");
const { readConfig } = require("../helper.js");

async function main() {
    // Get contract addresses from config
    const arbitratorManagerAddress = await readConfig(network.name, "ARBITRATOR_MANAGER");
    const nftContractAddress = await readConfig(network.name, "ERC721_ADDRESS");

    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log("Setting NFT Contract with account:", deployer.address);

    // Get ArbitratorManager contract
    const ArbitratorManager = await ethers.getContractAt(
        "ArbitratorManager", 
        arbitratorManagerAddress
    );

    // Call setNFTContract method
    const tx = await ArbitratorManager.connect(deployer).setNFTContract(nftContractAddress);
    
    console.log("Transaction sent. Waiting for confirmation...");
    await tx.wait();
    
    console.log("NFT Contract set successfully!");
    console.log("Transaction hash:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error setting NFT Contract:", error);
        process.exit(1);
    });
