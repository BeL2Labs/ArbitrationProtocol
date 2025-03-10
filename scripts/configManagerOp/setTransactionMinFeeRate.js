const { ethers, network, getChainId } = require("hardhat");
const { readConfig } = require("../helper.js");

async function main() {
    let chainId = await getChainId();
    console.log("chainId is :" + chainId, " network ", network.name);

    const [ deployer ] = await ethers.getSigners();
    console.log("Deployer address", deployer.address);

    const contractAddress = await readConfig(network.name, "CONFIG_MANAGER");
    const ConfigManager = await ethers.getContractFactory("ConfigManager", deployer);
    const configManager = ConfigManager.attach(contractAddress);

    // 设置交易最低费率（basis points）
    const tx = await configManager.setTransactionMinFeeRate(0);
    console.log("Transaction hash:", tx.hash);

    await tx.wait();
    console.log("Transaction confirmed");
    
    const key = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TRANSACTION_MIN_FEE_RATE"));
    const feeRate = await configManager.getConfig(key);
    console.log("Transaction min fee rate:", feeRate);
}

main().catch(console.error);
