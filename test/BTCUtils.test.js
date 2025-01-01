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
            const txHex = "0x020000000001014fe2cafe6618db5559476be56cc724535832a4797a8c6c04ebd5dca7a07f04650000000000010000000103280000000000001976a9149b42587007f85e456b5d0d702e828f34ea1f55b188ac05473044022057f207246708a1c5382b56798305a76f568c949ad3dff7bc95de9361ad7727a5022061641b3790ec3a83037b5d61e6f87034b40258f81460e38dfdf38cc2286f07ff01483045022100c4d6198525bf2a8822def06882a43515ea37520f009f52758b3ecac0968e7a23022065c525be4e29ad4a5af40413cc7d285f645e9aed76ed6ec93eee93676065643b01010100fd0a0163210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad21020d983021f335423a077bc62ddcbb8f18163959333747cdb079d116ecb45bffb0ac6763210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad21024b84ffd1896c96a8f81fc874c2b5b4a2051c50b1a8dd350de8ea03bb89484672ac676303ac0040b27521020d983021f335423a077bc62ddcbb8f18163959333747cdb079d116ecb45bffb0ada8205a0737e8cbcfa24dcc118b0ab1e6d98bee17c57daa8a1686024159aae707ed6f876703ac0040b275210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac68686800000000";
            
            // Convert hex to bytes
            const txBytes = ethers.utils.arrayify(txHex);
            console.log("txBytes ", txBytes);

            // Call the parseBTCTransaction method
            let rawData;
            rawData = await testBTCUtils.testParseBTCTransaction(txHex);
            console.log("rawData ", rawData);
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
