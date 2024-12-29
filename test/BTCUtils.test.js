const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BTCUtils", function () {
    let testBTCUtils;

    before(async function () {
        // Create a contract that uses the BTCUtils library
        const TestBTCUtilsFactory = await ethers.getContractFactory("TestBTCUtils");
        testBTCUtils = await TestBTCUtilsFactory.deploy();
        console.log("TestBTCUtils deployed to:", testBTCUtils.address);
    });

    describe("parseBTCTransaction", function () {
        it("should parse a valid Bitcoin transaction", async function () {
            // The transaction hex you provided
            const txHex = "0x020000000001017792dc57677dac39e25eacdde5337adf8783a46ccada9230ade7a898031b803e000000000000000000018d040000000000001976a9149b42587007f85e456b5d0d702e828f34ea1f55b188ac05483045022100da4920399bd497630a3542ae759cf528643028bcb63d4ea4723a5a2c9f1f428602206161a4cdcdb03dea6d7080e2191e807eca1459fead661a9d4e0b76bf81e6d74401483045022100da4920399bd497630a3542ae759cf528643028bcb63d4ea4723a5a2c9f1f428602206161a4cdcdb03dea6d7080e2191e807eca1459fead661a9d4e0b76bf81e6d74401010100fd0a0163210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad21020d983021f335423a077bc62ddcbb8f18163959333747cdb079d116ecb45bffb0ac6763210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac676303f10440b27521020d983021f335423a077bc62ddcbb8f18163959333747cdb079d116ecb45bffb0ada820805238c4310f7cf30919f6f18bb8632438094b5dff9a1f9af53bcb926cf1899a876703f10440b275210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac68686800000000";
            
            // Convert hex to bytes
            const txBytes = ethers.utils.arrayify(txHex);
            console.log("txBytes ", txBytes);

            // Call the parseBTCTransaction method
            const parsedTx = await testBTCUtils.testParseBTCTransaction(txHex);
            console.log(parsedTx);
            // Verify transaction details
            // expect(parsedTx.version).to.equal(2);
            // expect(parsedTx.inputs.length).to.equal(1);
            // expect(parsedTx.outputs.length).to.equal(1);
            // expect(parsedTx.locktime).to.equal(0);
            // expect(parsedTx.hasWitness).to.be.true;
        });

        // it("should revert for an invalid transaction", async function () {
        //     // Invalid transaction (too short)
        //     const invalidTxHex = "0x0200";
        //     const invalidTxBytes = ethers.utils.arrayify(invalidTxHex);

        //     // Expect the transaction parsing to revert
        //     await expect(testBTCUtils.testParseBTCTransaction(invalidTxBytes))
        //         .to.be.revertedWithCustomError(testBTCUtils, "INVALID_BTC_TX");
        // });
    });
});
