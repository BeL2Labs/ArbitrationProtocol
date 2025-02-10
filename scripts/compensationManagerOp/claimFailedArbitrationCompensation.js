const hre = require("hardhat");
const ethers = hre.ethers;
const { readConfig } = require("./helper.js");
async function main() {
    // Replace these with your actual values when running the script
    const arbitratorAddress = "0xb981c1c87091ee851fc56ebae7040f031452abb2"; // Address of the arbitrator
    const btcTxBytes = "0x02000000000101fc30133017f0af270ff8f3392e5c90617f6dddd8ab9c1d491fc6e94ab97d721d00000000000000000001c1260000000000001976a9149b42587007f85e456b5d0d702e828f34ea1f55b188ac0547304402202ae9abf3dfae7c40740111475e4eb854e3f7fd44393463be543b19f6c42a2a0f02207cfbc295a3b8b6adc74f3d250620f1e00a92dc275d29a18b00bdca95742b602b0147304402202ae9abf3dfae7c40740111475e4eb854e3f7fd44393463be543b19f6c42a2a0f02207cfbc295a3b8b6adc74f3d250620f1e00a92dc275d29a18b00bdca95742b602b01010100fd0a0163210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad21020d983021f335423a077bc62ddcbb8f18163959333747cdb079d116ecb45bffb0ac6763210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad21024b84ffd1896c96a8f81fc874c2b5b4a2051c50b1a8dd350de8ea03bb89484672ac676303b60040b27521020d983021f335423a077bc62ddcbb8f18163959333747cdb079d116ecb45bffb0ada8205a0737e8cbcfa24dcc118b0ab1e6d98bee17c57daa8a1686024159aae707ed6f876703bd0040b275210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac68686800000000";
    const evidenceBytes = "0x5d2209f852e732fce22eb913691518889f5da6b7b335151e00ae6211a2b74fd7"; // Evidence bytes

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