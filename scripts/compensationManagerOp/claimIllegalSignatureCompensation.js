const hre = require("hardhat");
const ethers = hre.ethers;
const { readConfig } = require("./helper.js");
async function main() {
  // Replace these with your actual values when running the script
  const arbitratorAddress = "0x0262aB0ED65373cC855C34529fDdeAa0e686D913"; // Address of the arbitrator
  const btcTxBytes = "0x0200000000010186613831be2e9099c24d51a0b81e06dbc3cef9ca5fc550812539075f2d666eb90000000000000000000184260000000000001976a9149b42587007f85e456b5d0d702e828f34ea1f55b188ac05483045022100d897e5f62a5e753e1ffadbfb9ab7f4b2297fe864d5c3cb4287b79ad82189b808022023d8749a52f36c9bac7a6e12dc5f53a78ca9367a79a64d72cb48ad6b6248a51301483045022100b0b988d47be5ce6092fa670e204c138e76ef80ae002ddf0386deaf1e1af96458022011fba4ec55ff1e33dafac2dd3e52e6812b17043eecaea214708d875ea41cd1bc01010100fd0a0163210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac6763210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad21024b84ffd1896c96a8f81fc874c2b5b4a2051c50b1a8dd350de8ea03bb89484672ac676303b60040b275210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ada8205a0737e8cbcfa24dcc118b0ab1e6d98bee17c57daa8a1686024159aae707ed6f876703bd0040b275210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac68686800000000";
  const evidenceBytes = "0x8b2fcbd2affe1febe86342605ec35e9379b4ccf088a15f48dfe21142c3abdbef"; // Evidence bytes

  // Get the CompensationManager contract
  const CompensationManager = await ethers.getContractFactory("CompensationManager");
  
  // Replace with the actual deployed contract address
  const compensationManagerAddress = await readConfig(hre.network.name, "COMPENSATION_MANAGER"); 
  const compensationManager = await CompensationManager.attach(compensationManagerAddress);
  try {
    let gasLimit = await compensationManager.estimateGas.claimIllegalSignatureCompensation(
      arbitratorAddress,
      btcTxBytes,
      evidenceBytes
    );
    console.log("gasLimit ", gasLimit);
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