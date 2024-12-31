const hre = require("hardhat");
const ethers = hre.ethers;
const { readConfig } = require("./helper.js");
async function main() {
  // Replace these with your actual values when running the script
  const arbitratorAddress = "0x0262ab0ed65373cc855c34529fddeaa0e686d913"; // Address of the arbitrator
  const btcTxBytes = "0x02000000000101d0a974b9186943c73fb4445e76dd948d562abcebf896472e1745e405a502e6fd00000000000000000001132b0000000000001976a914cb539f4329eeb589e83659c8304bcc6c99553a9688ac05424098cdbad099b506983ddd6104c5b142e14f88bdcafa2e87a58e5e0b3926f9efbf0e9bb4d270852ef4e58ceceb64062d949eee22c605b4a885a0f169ad1a1214f701424098cdbad099b506983ddd6104c5b142e14f88bdcafa2e87a58e5e0b3926f9efbf0e9bb4d270852ef4e58ceceb64062d949eee22c605b4a885a0f169ad1a1214f701010100fd0a016321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad2102e4059d0a57813a1974ddfd8555d3b5fe89717dfa76651a32604065eab3a47e94ac676321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad21036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac676303ab0440b2752102e4059d0a57813a1974ddfd8555d3b5fe89717dfa76651a32604065eab3a47e94ada8205a0737e8cbcfa24dcc118b0ab1e6d98bee17c57daa8a1686024159aae707ed6f876703b20440b27521036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac68686800000000"; // Bitcoin transaction bytes
  const evidenceBytes = "0x7792dc57677dac39e25eacdde5337adf8783a46ccada9230ade7a898031b803e"; // Evidence bytes

  // Get the CompensationManager contract
  const CompensationManager = await ethers.getContractFactory("CompensationManager");
  
  // Replace with the actual deployed contract address
  const compensationManagerAddress = await readConfig(hre.network.name, "COMPENSATION_MANAGER"); 
  const compensationManager = await CompensationManager.attach(compensationManagerAddress);

  try {
    // Call the claimIllegalSignatureCompensation method
    const tx = await compensationManager.claimIllegalSignatureCompensation(
      arbitratorAddress, 
      btcTxBytes, 
      evidenceBytes
    );

    console.log("Transaction sent. Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("Transaction confirmed. Transaction hash:", receipt.transactionHash);
  } catch (error) {
    console.error("Error claiming illegal signature compensation:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });