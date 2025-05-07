const { ethers, network, getChainId } = require("hardhat");
const { readConfig } = require("../helper.js");

async function setArbitrationBTCFeeRate() {
    let chainId = await getChainId();
    console.log("chainId is :" + chainId, " network ", network.name);

    const [ deployer ] = await ethers.getSigners();
    console.log("Deployer address", deployer.address);

    // Read contract address from config.json
    const contractAddress = await readConfig(network.name, "CONFIG_MANAGER");

    const ConfigManager = await ethers.getContractFactory("ConfigManager", deployer);

    // Create contract instance
    const configManager = ConfigManager.attach(contractAddress);

    const owner = await configManager.owner();
    console.log("owner ", owner);
}

setArbitrationBTCFeeRate().catch(console.error);
