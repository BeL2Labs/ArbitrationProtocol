const { ethers, network, getChainId } = require("hardhat");
const { readConfig } = require("../helper.js");

async function main() {
    let chainId = await getChainId();
    console.log("chainId is :" + chainId, " network ", network.name);

    const [ deployer ] = await ethers.getSigners();
    console.log("Deployer address", deployer.address);

    const contractAddress = await readConfig(network.name, "ASSET_MANAGER");

    console.log("contractAddress address", contractAddress);

    const contractFactory = await ethers.getContractFactory("AssetManager", deployer);
    const newContract = await upgrades.upgradeProxy(contractAddress, contractFactory, {
        timeout: 60000,
        pollingInterval: 5000,
        txOverrides: {
            gasLimit: 3000000,
            gasPrice: 1000000000 // 1 gwei
        }});


    console.log('completed.');

}

main();
