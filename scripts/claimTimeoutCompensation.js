const { ethers, network } = require("hardhat");
const { readConfig } = require("./helper.js");
async function main() {
  // Transaction ID to claim timeout compensation for
  const txId = "0xd19ce26dff7aaf26df7e4790fc568c45b5a252c335a30159407aa2487cbae3b4";

  // Get the deployed CompensationManager contract
  const CompensationManager = await ethers.getContractFactory("CompensationManager");
  
  // Get the signer (the account that will call the method)
  const [signer] = await ethers.getSigners();
  
  // Get the deployed contract instance 
  // Note: Replace with the actual deployed contract address
  const compensationManagerAddress = await readConfig(network.name, "COMPENSATION_MANAGER");
  const compensationManager = CompensationManager.attach(compensationManagerAddress);

  try {
    // Call the claimTimeoutCompensation method
    const tx = await compensationManager.connect(signer).claimTimeoutCompensation(
      txId,
      {
        gasLimit: 300000 // Hardcoded gas limit
      });
    
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    
    console.log("Timeout Compensation Claimed Successfully!");
    console.log("Transaction Hash:", tx.hash);
    console.log("Block Number:", receipt.blockNumber);
  } catch (error) {
    console.error("Error claiming timeout compensation:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
