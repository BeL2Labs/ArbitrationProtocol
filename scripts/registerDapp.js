const { ethers, network, getChainId } = require("hardhat");
const { readConfig } = require("./helper.js");

let dapp = '0x98568A3abB586B92294cDb4AD5b03E560BCADb06';

async function main() {
  const chainID = await getChainId();
  console.log("chain ID:", chainID);
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.provider.getBalance(deployer.address)).toString());
  // Get the contract factory
  const DAppRegistry = await ethers.getContractFactory("DAppRegistry");
  // Get the deployed contract address from config
  const dappRegistryAddress = await readConfig(network.name, "DAPP_REGISTRY");
  console.log("dappRegistryAddress:", dappRegistryAddress);
  
  // Get the contract instance
  const contract = await DAppRegistry.attach(dappRegistryAddress).connect(deployer);

  const payAmount = ethers.utils.parseEther("10.0"); // Staking 10 ETH, adjust as needed
  console.log("payAmount:", ethers.utils.formatEther(payAmount), "ETH");
  let gasLimit = await contract.estimateGas.registerDApp(dapp, {value:payAmount});
  console.log("gasLimit:", gasLimit);

  const tx = await contract.registerDApp(deployer.address, {gasLimit: gasLimit, value:payAmount});
  await tx.wait();
  console.log("registerDapp dapp tx ", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
