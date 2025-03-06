const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BTCUtils", function () {
    let testBTCUtils;

    before(async function () {
        // Create a contract that uses the BTCUtils library
        const TestBTCUtilsFactory = await ethers.getContractFactory("BTCUtils");
        testBTCUtils = await TestBTCUtilsFactory.deploy();
        console.log("TestBTCUtils deployed to:", testBTCUtils.address);
    });

    describe("parseBTCTransaction", function () {
        it("should parse a valid Bitcoin transaction", async function () {
            // The transaction hex you provided
            const txHex = "0x02000000000101a47f197216cdf5ecfdf17abb499d9b28a8a0b07f79c7c452d896cc470219c8c100000000000000000002701f0000000000001976a914cb539f4329eeb589e83659c8304bcc6c99553a9688ac1c040000000000001976a914ead4667312ac687dbddde40fd549ad0ce431742b88ac0547304402205025f4d72820c479095f08beae16ee7b5471ba619bb930c0a561d7aeb2dd119202201a79bd69ef1321efcbb112bd3c67b4e4becda7a9f6a14233608562058a36532201473044022045d37b264d3ce674ce769cfb26907d0357b1a82bbf57d34b0b9ec2513a7ae91402203b5d000df0303ba32c4a210fb6fd4ed98bf01612eacf906a496ea331938673c801010100fd0a016321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad210249d5b1a12045ff773b85033d3396faa32fd579cee25c4f7bb6aef6103228bd72ac676321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad210249d5b1a12045ff773b85033d3396faa32fd579cee25c4f7bb6aef6103228bd72ac676303b60040b275210249d5b1a12045ff773b85033d3396faa32fd579cee25c4f7bb6aef6103228bd72ada820d33b43be98c98eaf20ae03306859c84492fb8354a62a4f48591845e1d646a325876703bd0040b27521036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac68686800000000";
            
            // Convert hex to bytes
            const txBytes = ethers.utils.arrayify(txHex);
            console.log("txBytes ", txBytes);

            // Call the parseBTCTransaction method
            const parsedTx = await testBTCUtils.parseBTCTransaction(txHex);
            console.log("parsedTx ", parsedTx);
            // Verify transaction details
            expect(parsedTx.version).to.equal(2);
            expect(parsedTx.inputs.length).to.equal(1);
            expect(parsedTx.outputs.length).to.equal(2);
            expect(parsedTx.locktime).to.equal(0);
            expect(parsedTx.hasWitness).to.be.true;
        });

        it("should revert for an invalid transaction", async function () {
            // Invalid transaction (too short)
            const invalidTxHex = "0x0200";
            const invalidTxBytes = ethers.utils.arrayify(invalidTxHex);

            // Expect the transaction parsing to revert
            await expect(testBTCUtils.parseBTCTransaction(invalidTxBytes))
                .to.be.revertedWith("T7");
        });
    });
});
