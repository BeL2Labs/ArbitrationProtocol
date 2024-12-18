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

  const tx = await contract.authorizeDApp(deployer.address, {gasLimit: 2000000});
  await tx.wait();
  console.log("authorizeDApp dapp tx ", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
