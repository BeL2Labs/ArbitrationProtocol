const { ethers, network, getChainId } = require("hardhat");
const { readConfig } = require("../helper.js");

async function main() {
  const chainID = await getChainId();
  console.log("chain ID:", chainID);

  const [owner] = await ethers.getSigners();
  
  // Calculate 1 year from now (31536000 seconds)
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const deadline = currentTimestamp + 31536000;

  const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager");
  const arbitratorManagerAddress = await readConfig(network.name, "ARBITRATOR_MANAGER");
  const arbitratorManager = await ArbitratorManager.attach(arbitratorManagerAddress).connect(owner);

  console.log("Setting deadline to:", new Date(deadline * 1000).toISOString());

  const gasLimit = await arbitratorManager.estimateGas.setArbitratorDeadline(deadline);
  const tx = await arbitratorManager.setArbitratorDeadline(deadline, {
    gasLimit: gasLimit.mul(12).div(10) // Add 20% buffer
  });

  await tx.wait();
  console.log("Deadline set successfully. Tx hash:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
