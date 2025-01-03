const hre = require("hardhat");
const ethers = hre.ethers;
const { readConfig } = require("./helper.js");
async function main() {
  // Replace these with your actual values when running the script
  const arbitratorAddress = "0x4267f8536831c2b437d6b457e48c4b21706d9bb3"; // Address of the arbitrator
  const btcTxBytes = "0x0200000000010170a62b2279637af4247890904256c27649a72b76b1945ca919aed1ba0fef23150000000000000000000131270000000000001976a9149b42587007f85e456b5d0d702e828f34ea1f55b188ac05473044022004ee618f44e816d6fb087394bd5f5709ec4a20fd2b7bd7a74833c600c9af977e02200aeb3826114e37a65a7ac1d7cb0de90dc48016080fe0da8dfe7b6422dff1953d0147304402207905fb68bae5a821ba868f57ca13c7f66b38d0dcde3a38fda745210a2e14291d02206cb723bd4cb9c3f0ad6d28561bcfd607a1087102b32ac42754c9535df5c99e7901010100fd0a0163210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad21020d983021f335423a077bc62ddcbb8f18163959333747cdb079d116ecb45bffb0ac6763210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad21027befe931049bb2656d0d9b50046ea51ef38bd5f3e250a003f7d716e9e42ea813ac676303ac0040b27521020d983021f335423a077bc62ddcbb8f18163959333747cdb079d116ecb45bffb0ada8205a0737e8cbcfa24dcc118b0ab1e6d98bee17c57daa8a1686024159aae707ed6f876703ac0040b275210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac68686800000000";
  const evidenceBytes = "0x7df4d970a3ad011033975b41b05683a87ad549240d1c875a1a409a4ff52cd588"; // Evidence bytes

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
  return;
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