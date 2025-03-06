const { ethers, network, getChainId } = require("hardhat");
const { readConfig } = require("../helper.js");

async function main() {
  const chainID = await getChainId();
  console.log("chain ID:", chainID);
  const [deployer, operator] = await ethers.getSigners();
  // Get the contract factory
  const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager");
  console.log("deployer ", deployer.address);
  // Get the deployed contract address from config
  const arbitratorManagerAddress = await readConfig(network.name, "ARBITRATOR_MANAGER");
  console.log("arbitratorManagerAddress:", arbitratorManagerAddress);
  
  // Get the contract instance
  const arbitratorManager = await ArbitratorManager.attach(arbitratorManagerAddress).connect(deployer);

  // Amount of ETH to stake (in wei)
  const NFTID = BigInt("30243043197013028619958910705737974404473646632886461185500847819109343512777");
  console.log("Staking NFTID:", NFTID);

  let gasLimit = await arbitratorManager.estimateGas.stakeNFT([NFTID])
  console.log("gasLimit:", gasLimit);
  // Call stakeETH with the specified amount
  // const tx = await arbitratorManager.stakeNFT([NFTID],{
  //   gasLimit: gasLimit
  // });
  //
  // // Wait for the transaction to be mined
  // await tx.wait();
  //
  // console.log("Successfully staked NFT!");
  // console.log("Transaction hash:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
