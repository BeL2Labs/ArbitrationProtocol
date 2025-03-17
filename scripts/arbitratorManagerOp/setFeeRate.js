const { ethers, network, getChainId } = require("hardhat");
const { readConfig } = require("../helper.js");

async function main() {
  const chainID = await getChainId();
  console.log("chain ID:", chainID);

  const [owner] = await ethers.getSigners();

  const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager");
  const arbitratorManagerAddress = await readConfig(network.name, "ARBITRATOR_MANAGER");
  const arbitratorManager = await ArbitratorManager.attach(arbitratorManagerAddress).connect(owner);


  const gasLimit = await arbitratorManager.estimateGas.setFeeRates(0,0);
  // const tx = await arbitratorManager.setFeeRates(0, 0, {
  //   gasLimit: gasLimit
  // });

  // await tx.wait();
  // console.log("setFeeRates set successfully. Tx hash:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
