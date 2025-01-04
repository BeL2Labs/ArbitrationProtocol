const { ethers, network, getChainId } = require("hardhat");
const { readConfig } = require("./helper.js");


async function main() {
    const chainID = await getChainId();
    console.log("chain ID:", chainID);
    const [owner, operator] = await ethers.getSigners();
    console.log("owner address:", owner.address);

    // Get the contract factory
    const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager");

    // Get the deployed contract address from config
    const arbitratorManagerAddress = await readConfig(network.name, "ARBITRATOR_MANAGER");
    console.log("arbitratorManagerAddress:", arbitratorManagerAddress);

    // Get the contract instance
    const arbitratorManager = await ArbitratorManager.attach(arbitratorManagerAddress).connect(owner);

    let arbitrator = "0xcD869291a10B3070Cf9bC6bb9e67Ef60F34b10B5";
    let txId = "0x492d988d47f46931e6469fc6bb521e08275ee980a84fea565fc524ca499a47d6";
    let gasLimit = await arbitratorManager.estimateGas.releaseArbitrator(arbitrator, txId);
    console.log("gasLimit:", gasLimit);
    const tx = await arbitratorManager.releaseArbitrator(arbitrator, txId, {gasLimit: gasLimit});
    await tx.wait();
    console.log("releaseArbitrator tx ", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
