const { ethers, network, getChainId } = require("hardhat");
const { readConfig } = require("./helper.js");

async function main() {
  const chainID = await getChainId();
  console.log("chain ID:", chainID);
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // Get the contract factory
  const DAppRegistry = await ethers.getContractFactory("DAppRegistry");
  
  // Get the deployed contract address from config
  const dappRegistryAddress = await readConfig(network.name, "DAPP_REGISTRY");
  console.log("dappRegistryAddress:", dappRegistryAddress);
  
  // Get the contract instance
  const contract = await DAppRegistry.attach(dappRegistryAddress);

  const payAmount = ethers.parseEther("10.0"); // Staking 1 ETH, adjust as needed
  console.log("payAmount:", ethers.formatEther(payAmount), "ETH");
  const tx = await contract.registerDApp(deployer.address, {gasLimit: 2000000, value:payAmount});
  await tx.wait();
  console.log("registerDapp dapp tx ", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
