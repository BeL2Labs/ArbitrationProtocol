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
            const txHex = "0x02000000012fde4be6599fd4926b8c1d18f086da8a7bb71c044aa94c65fcf223b49be9111300000000000000000001b4290000000000001976a914cb539f4329eeb589e83659c8304bcc6c99553a9688ac00000000";
            
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
