const hre = require("hardhat");
const ethers = hre.ethers;
const { readConfig } = require("./helper.js");
async function main() {
    // Replace these with your actual values when running the script
    const arbitratorAddress = "0xb981c1c87091ee851fc56ebae7040f031452abb2"; // Address of the arbitrator
    const btcTxBytes = "0x02000000000101d34f2376356018cf5472d247ca383fea93cf3f0823688e503cf786638a7c128d0000000000000000000184260000000000001976a9149b42587007f85e456b5d0d702e828f34ea1f55b188ac0542409551ec3830668eddea2636cedc656782a5acd7db46da9c8287f73eca122147b97755206badc6430096ef3d3ec84d90ceadec3103c48479366b578be53282697501483045022100aac0287da190779579f32e4b4f5ca9c6405efc42eb78596112f61df80307e0d102205f5a41cdbde309b6bb8c9addbb36e89cc5b0409d90d8d698cd23a9ec8c54e07d01010100fd0a0163210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad21020d983021f335423a077bc62ddcbb8f18163959333747cdb079d116ecb45bffb0ac6763210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad21020528045c36457e95d1845398d09ddb0b1007a97125398d7807f3a45dd1d48005ac676303b60040b27521020d983021f335423a077bc62ddcbb8f18163959333747cdb079d116ecb45bffb0ada8205a0737e8cbcfa24dcc118b0ab1e6d98bee17c57daa8a1686024159aae707ed6f876703bd0040b275210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac68686800000000";
    const evidenceBytes = "0x933146b1b4a2b6260a7467f170a26ad2632abd5a8939065a0f0943bc7700a1e6"; // Evidence bytes

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