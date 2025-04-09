const { ethers, network, getChainId } = require("hardhat");
const { readConfig } = require("../helper.js");

async function main() {
    const chainId = await getChainId();
    console.log("chainId:", chainId, "network:", network.name);

    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    const contractAddress = await readConfig(network.name, "CONFIG_MANAGER");
    const ConfigManager = await ethers.getContractFactory("ConfigManager", deployer);
    const configManager = ConfigManager.attach(contractAddress);

    // 设置BTC交易最低费率为0%（0 basis points）
    let gasLimit = await configManager.estimateGas.setTransactionMinBTCFeeRate(0);
    console.log("gasLimit = ", gasLimit);
    const tx = await configManager.setTransactionMinBTCFeeRate(0);
    console.log("Transaction hash:", tx.hash);

    await tx.wait();
    console.log("Transaction confirmed");

    // 验证配置更新
    const key = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TRANSACTION_MIN_BTC_FEE_RATE"));
    const currentRate = await configManager.getConfig(key);
    console.log("Current BTC min fee rate:", currentRate.toString());
}

main().catch(console.error);
