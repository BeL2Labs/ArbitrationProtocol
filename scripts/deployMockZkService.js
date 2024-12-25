const hre = require("hardhat");
const { sleep, writeConfig, readConfig } = require("./helper.js");
async function main() {
  // Get the contract factory for MockZkService
  const MockZkService = await hre.ethers.getContractFactory("MockZkService");

  // Deploy the contract
  const mockZkService = await MockZkService.deploy();
  
  // Wait for the contract to be deployed
  await mockZkService.deployed();
   await writeConfig(hre.network.name, "ZK_SERVICE", mockZkService.address);
  console.log("MockZkService deployed to:", mockZkService.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
