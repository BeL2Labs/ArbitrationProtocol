const hre = require("hardhat");
const ethers = hre.ethers;
const { readConfig } = require("./helper.js");
async function main() {
    // Replace these with your actual values when running the script
    const arbitratorAddress = "0xb981c1c87091ee851fc56ebae7040f031452abb2"; // Address of the arbitrator
    const btcTxBytes = "0x020000000001019acfad6ab0ef70780928a6ba02c436478d62b8932d67b91602d64e388ab49b300000000000000000000103270000000000001976a9149b42587007f85e456b5d0d702e828f34ea1f55b188ac054240ed055f95fcedb8b8ee38c924392d814b7aed0367e4e118d9874584888d2ab2212e09b595dc3bf5014e6de701cf8fdbcccdca4b227aa9714266735e655f4fdbe201473044022027744fa6a41f887dc3c6b45dc47bb75f1ab645fb03f2a0a1eebdd8708dabc9f002201350f6e00e259adbbb4b2307c5c7719cec22f1221c5e799e2ffca0304386541401010100fd0a0163210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad21020d983021f335423a077bc62ddcbb8f18163959333747cdb079d116ecb45bffb0ac6763210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad21020528045c36457e95d1845398d09ddb0b1007a97125398d7807f3a45dd1d48005ac676303b60040b27521020d983021f335423a077bc62ddcbb8f18163959333747cdb079d116ecb45bffb0ada8205a0737e8cbcfa24dcc118b0ab1e6d98bee17c57daa8a1686024159aae707ed6f876703bd0040b275210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac68686800000000";
    const evidenceBytes = "0x4094b4b922c0e56db023fb6835a9db80eba59775ed002869719bbd151e96e3ac"; // Evidence bytes

    // Get the CompensationManager contract
    const CompensationManager = await ethers.getContractFactory("CompensationManager");

    // Replace with the actual deployed contract address
    const compensationManagerAddress = await readConfig(hre.network.name, "COMPENSATION_MANAGER");
    const compensationManager = await CompensationManager.attach(compensationManagerAddress);
    try {
        let gasLimit = await compensationManager.estimateGas.claimFailedArbitrationCompensation(
            btcTxBytes,
            evidenceBytes
        );
        console.log("gasLimit ", gasLimit);
        return;
        // Call the claimIllegalSignatureCompensation method
        const tx = await compensationManager.claimFailedArbitrationCompensation(
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