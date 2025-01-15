const { expect } = require("chai");
const { ethers } = require("hardhat");
const { upgrades } = require("hardhat");
const {sleep} = require("../scripts/helper");

describe("CompensationManager", function () {
    let zkService;
    let validationService;
    let compensationManager;
    let transactionManager;
    let configManager;
    let arbitratorManager;
    let dappRegistry;
    let mockNFT;
    let mockNFTInfo;
    let owner;
    let dapp;
    let arbitrator;
    let user;
    let user1;
    let compensationReceiver;
    let timeoutReceiver;
    let transactionId;
    const duration = 30 * 24 * 60 * 60; // 30days

    const VALID_BTC_TX = "0x02000000e5cd49421a525ae552acc8abd1d126108317aa517d96cd8550895d10486819da8cb9012517c817fead650287d61bdd9c68803b6bf9c64133dcab3e65b5a50cb9e2892172663c3d37fbc68260898676f5440fb4702289242fd82dcbef21be070c00000000fd0a0163210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac6763210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad2102b32f28976aa0be56a9de7cb7764c31c62a8d844244d9a5ecbe348e97e85475dfac676303b60040b275210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ada8205a0737e8cbcfa24dcc118b0ab1e6d98bee17c57daa8a1686024159aae707ed6f876703bd0040b275210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac686868692900000000000000000000c19695b1d2324599c15f4b3b47c0379b9a0c8b10512fc69cc93abf09f8afa3fe0000000001000000";
    const VALID_SIGNATURE = "0x30440220287e9e41c54b48c30e46ea442aa80ab793dac56d3816dbb2a5ea465f0c6e26e1022079aed874e9774b23c98ad9a60b38f37918591d50af83f49b92e63b9ce74fdedf";
    const VALID_TX_HASH = "0x3b07965292e50272b6ee3ba2c89fea4c6f626e8ad01a25dd509f97b53d88d581";
    const VALID_PUB_KEY = "0x02b1a82d3c01657ffa2b2b3433896386ac3fcad4cd04cffc74a90cba4c4bd8adde";
    const VALID_UTXOS = [{
        txHash: "0x0c07be21efcb2dd82f24892270b40f44f57686896082c6fb373d3c66722189e2",
        index: 0,
        script: "0x0020d473100bd1a04e1ea90ad3e5411e6b4b75ca5d96b57781fc09bc79f135b24531",
        amount: 10816
    }];
    const VALID_EVIDENCE = "0xa8a0b55bd00df1287445685c7c4a7e0a3df8edd82fee186cfcfda436f2924cea";
    const STAKE_AMOUNT = ethers.utils.parseEther("1.0");

    beforeEach(async function () {
        [owner, dapp, arbitrator, user, user1, compensationReceiver, timeoutReceiver] = await ethers.getSigners();

        // Deploy mock contracts
        const MockZkService = await ethers.getContractFactory("MockZkService");
        const MockSignatureValidationService = await ethers.getContractFactory("MockSignatureValidationService");
        const MockNFT = await ethers.getContractFactory("MockNFT");
        const MockNFTInfo = await ethers.getContractFactory("MockNFTInfo");
        const ConfigManager = await ethers.getContractFactory("ConfigManager");
        const DappRegistry = await ethers.getContractFactory("DAppRegistry");
        const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager");
        const TransactionManager = await ethers.getContractFactory("TransactionManager");
        const CompensationManager = await ethers.getContractFactory("CompensationManager");

        // Deploy contracts
        zkService = await MockZkService.deploy();
        validationService = await MockSignatureValidationService.deploy();
        mockNFT = await MockNFT.deploy();
        mockNFTInfo = await MockNFTInfo.deploy();
        configManager = await upgrades.deployProxy(ConfigManager, [], { initializer: 'initialize' });
        dappRegistry = await upgrades.deployProxy(DappRegistry, [configManager.address], { initializer: 'initialize' });
        arbitratorManager = await upgrades.deployProxy(ArbitratorManager, [
            configManager.address,
            mockNFT.address,
            mockNFTInfo.address
        ], { initializer: 'initialize' });

        compensationManager = await upgrades.deployProxy(CompensationManager, [
            zkService.address,
            configManager.address,
            arbitratorManager.address,
            validationService.address
        ], { initializer: 'initialize' });

        transactionManager = await upgrades.deployProxy(TransactionManager, [
            arbitratorManager.address,
            dappRegistry.address,
            configManager.address,
            compensationManager.address
        ], { initializer: 'initialize' });

        // Set transactionManager
        await compensationManager.connect(owner).setTransactionManager(transactionManager.address);

        // Initialize contracts
        await arbitratorManager.initTransactionAndCompensationManager(transactionManager.address, compensationManager.address);
        // Register dapp and arbitrator
        await dappRegistry.connect(owner).registerDApp(
            dapp.address,
            {value: ethers.utils.parseEther("10")}
        );

        await dappRegistry.connect(owner).authorizeDApp(
            dapp.address,
        );

        const btcAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
        const deadline = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 356 days from now
        const feeRate = 1000; // 10%
        let tx = await arbitratorManager.connect(arbitrator).registerArbitratorByStakeETH(
            btcAddress,
            VALID_PUB_KEY,
            feeRate,
            deadline,
            { value: STAKE_AMOUNT }
        );
        await tx.wait();

        // Correctly register transaction using registerTransaction
        const txData = {
            sender: owner.address,
            recipient: user1.address,
            amount: ethers.utils.parseEther("1"),
        };

        const registerTx = await transactionManager.connect(dapp).registerTransaction(
            arbitrator.address,
            Math.floor(Date.now() / 1000) + duration, // 30 days from now
            compensationReceiver.address,
            { value: ethers.utils.parseEther("0.1") }
        );
        const receipt = await registerTx.wait();
        const event = receipt.events.find(e => e.event === "TransactionRegistered");
        transactionId = event.args[0];
        await transactionManager.connect(dapp).uploadUTXOs(transactionId, VALID_UTXOS);
    });

    describe("claimIllegalSignatureCompensation", function () {
        it("should succeed with valid verification data", async function () {
            await zkService.setValidVerification(
                VALID_EVIDENCE,
                VALID_PUB_KEY,
                VALID_TX_HASH,
                VALID_SIGNATURE,
                VALID_UTXOS
            );

            let verification = await zkService.getZkVerification(VALID_EVIDENCE);
            expect(verification.pubKey).to.equal(VALID_PUB_KEY);
            expect(verification.txHash).to.equal(VALID_TX_HASH);
            expect(verification.signature).to.equal(VALID_SIGNATURE);
            expect(verification.verified).to.be.true;

            // Claim compensation
            const claimTx = await compensationManager.connect(dapp).claimIllegalSignatureCompensation(
                arbitrator.address,
                VALID_EVIDENCE
            );
            
            // Verify events and claim details
            const receipt = await claimTx.wait();
            const claimEvent = receipt.events.find(e => e.event === 'CompensationClaimed');
            expect(claimEvent).to.exist;
            expect(claimEvent.args[7]).to.equal(0); // IllegalSignature type

            expect(await arbitratorManager.getAvailableStake(arbitrator.address)).to.equal(0);

            const transaction = await transactionManager.getTransactionById(transactionId);
            expect(transaction.status).to.equal(1);

            const claimId = ethers.utils.solidityKeccak256(
                ["bytes32", "address", "address", "uint8"],
                [VALID_EVIDENCE, arbitrator.address, compensationReceiver.address, 0]
              );
            const compensationClaim = await compensationManager.claims(claimId);
            expect(compensationClaim.claimer).to.equal(dapp.address);
            expect(compensationClaim.arbitrator).to.equal(arbitrator.address);
            expect(compensationClaim.claimType).to.equal(0);
            expect(compensationClaim.withdrawn).to.equal(false);
            expect(compensationClaim.ethAmount).to.equal(STAKE_AMOUNT);
            expect(compensationClaim.totalAmount).to.equal(STAKE_AMOUNT);
            expect(compensationClaim.receivedCompensationAddress).to.equal(compensationReceiver.address);
        });

        it("should revert with invalid utxos", async function () {
            await zkService.setValidVerification(
                VALID_EVIDENCE,
                VALID_PUB_KEY,
                VALID_TX_HASH,
                VALID_SIGNATURE,
                []
            );

            await expect(compensationManager.connect(dapp).claimIllegalSignatureCompensation(
                arbitrator.address,
                VALID_EVIDENCE
            )).to.be.revertedWith("U0");
        });

        it("should revert with public key mismatch", async function () {
            const pubkey = "0x03cb0ee3eb3e9cdfdfdd6a5b276f7e480153caa491c590f8ac4a15dbde0442e6ea";
            await zkService.setValidVerification(
                VALID_EVIDENCE,
                pubkey,
                VALID_TX_HASH,
                VALID_SIGNATURE,
                VALID_UTXOS
            );
            await expect(compensationManager.connect(dapp).claimIllegalSignatureCompensation(
                arbitrator.address,
                VALID_EVIDENCE
            )).to.be.revertedWith("M7");
        });

        it("should revert with no active transaction", async function () {
            await transactionManager.connect(dapp).requestArbitration(
                transactionId,
                VALID_BTC_TX,
                1,
                "0xab2348",
                user.address
            );

            await transactionManager.connect(arbitrator).submitArbitration(
                transactionId,
                VALID_SIGNATURE);

            await zkService.setValidVerification(
                VALID_EVIDENCE,
                VALID_PUB_KEY,
                VALID_TX_HASH,
                VALID_SIGNATURE,
                VALID_UTXOS
            );

            await expect(compensationManager.connect(dapp).claimIllegalSignatureCompensation(
                arbitrator.address,
                VALID_EVIDENCE
            )).to.be.revertedWith("M8");
        });

        it("should revert with zk proof failed ", async function () {
            await zkService.setInvalidVerification(
                VALID_EVIDENCE,
                1,
                "0x",
                VALID_TX_HASH,
                VALID_SIGNATURE,
                []
            );

            await expect(compensationManager.connect(dapp).claimIllegalSignatureCompensation(
                arbitrator.address,
                VALID_EVIDENCE
            )).to.be.revertedWith("M6");
        });
    });
    describe("claimFailedArbitrationCompensation", function () {
        beforeEach(async function () {
            await transactionManager.connect(dapp).requestArbitration(
                transactionId,
                VALID_BTC_TX,
                1,
                "0xab2348",
                timeoutReceiver.address
            );
        });

        it("should succeed with invalid verification data", async function () {
            const valid_evidence = ethers.utils.solidityKeccak256(
                ["bytes32", "uint8", "bytes", "bytes"],
                [VALID_TX_HASH, 0, VALID_SIGNATURE, VALID_PUB_KEY]
            );
            await validationService.submitFailedData(
                VALID_TX_HASH,
                0,
                VALID_SIGNATURE,
                VALID_PUB_KEY
            );
            await transactionManager.connect(arbitrator).submitArbitration(
                transactionId,
                VALID_SIGNATURE);

            const claimId = ethers.utils.solidityKeccak256(
                ["bytes32", "address", "address", "uint8"],
                [valid_evidence, arbitrator.address, compensationReceiver.address, 2]
              );

            await expect(compensationManager.connect(dapp).claimFailedArbitrationCompensation(
                valid_evidence
            )).to.emit(compensationManager, "CompensationClaimed").withArgs(
                claimId,
                dapp.address,
                arbitrator.address,
                STAKE_AMOUNT,
                [],
                STAKE_AMOUNT,
                compensationReceiver.address,
                2
            );

            expect(await arbitratorManager.getAvailableStake(arbitrator.address)).to.equal(0);

            const transaction = await transactionManager.getTransactionById(transactionId);
            expect(transaction.status).to.equal(1);

            const compensationClaim = await compensationManager.claims(claimId);
            expect(compensationClaim.claimer).to.equal(dapp.address);
            expect(compensationClaim.arbitrator).to.equal(arbitrator.address);
            expect(compensationClaim.claimType).to.equal(2);
            expect(compensationClaim.withdrawn).to.equal(false);
            expect(compensationClaim.ethAmount).to.equal(STAKE_AMOUNT);
            expect(compensationClaim.totalAmount).to.equal(STAKE_AMOUNT);
            expect(compensationClaim.receivedCompensationAddress).to.equal(compensationReceiver.address);
        });

        it("should revert with signature not submitted", async function () {
            const valid_evidence = ethers.utils.solidityKeccak256(
                ["bytes32", "uint8", "bytes", "bytes"],
                [VALID_TX_HASH, 0, VALID_SIGNATURE, VALID_PUB_KEY]
            );
            await validationService.submitFailedData(
                VALID_TX_HASH,
                0,
                VALID_SIGNATURE,
                VALID_PUB_KEY
            );
            await expect(compensationManager.connect(dapp).claimFailedArbitrationCompensation(
                valid_evidence
            )).to.be.revertedWith("S5");
        });

        it("should revert with signature mismatch", async function () {
            const signature = "0x30440220785b0fafc9a705952850455098820dd16eb1401c8cb4c743a836414679eeaeef022059e625a5cbb5f5508c30b1764c4d11a2b1d7d6676250a33da77b2c48a52eb1e9";
            await transactionManager.connect(arbitrator).submitArbitration(
                transactionId,
                VALID_SIGNATURE);

            const valid_evidence = ethers.utils.solidityKeccak256(
                ["bytes32", "uint8", "bytes", "bytes"],
                [VALID_TX_HASH, 0, signature, VALID_PUB_KEY]
            );
            await validationService.submitFailedData(
                VALID_TX_HASH,
                0,
                signature,
                VALID_PUB_KEY
            );
            await expect(compensationManager.connect(dapp).claimFailedArbitrationCompensation(
                valid_evidence
            )).to.be.revertedWith("S6");
        });

        it("should revert with public key mismatch", async function () {
            const pubkey = "0x03cb0ee3eb3e9cdfdfdd6a5b276f7e480153caa491c590f8ac4a15dbde0442e6ea";
            await transactionManager.connect(arbitrator).submitArbitration(
                transactionId,
                VALID_SIGNATURE);

            const valid_evidence = ethers.utils.solidityKeccak256(
                ["bytes32", "uint8", "bytes", "bytes"],
                [VALID_TX_HASH, 0, VALID_SIGNATURE, pubkey]
            );
            await validationService.submitFailedData(
                VALID_TX_HASH,
                0,
                VALID_SIGNATURE,
                pubkey
            );
            await expect(compensationManager.connect(dapp).claimFailedArbitrationCompensation(
                valid_evidence
            )).to.be.revertedWith("M7");
        });

        it("should revert with verified", async function () {
            await transactionManager.connect(arbitrator).submitArbitration(
                transactionId,
                VALID_SIGNATURE);

            const valid_evidence = ethers.utils.solidityKeccak256(
                ["bytes32", "uint8", "bytes", "bytes"],
                [VALID_TX_HASH, 0, VALID_SIGNATURE, VALID_PUB_KEY]
            );
            await validationService.submit(
                VALID_TX_HASH,
                0,
                VALID_SIGNATURE,
                VALID_PUB_KEY
            );
            await expect(compensationManager.connect(dapp).claimFailedArbitrationCompensation(
                valid_evidence
            )).to.be.revertedWith("S7");
        });
    });

    describe("claimTimeoutCompensation", function () {
        let claimId;
        beforeEach(async function () {
            await transactionManager.connect(dapp).requestArbitration(
                transactionId,
                VALID_BTC_TX,
                1,
                "0xab2348",
                timeoutReceiver.address
            );

            claimId = ethers.utils.solidityKeccak256(
                ["bytes32", "address", "address", "uint8"],
                [transactionId, arbitrator.address, timeoutReceiver.address, 1]
              );
        });
        it("should scceed after timeout", async function () {
            const configTime = await configManager.getArbitrationTimeout();
            await network.provider.send("evm_increaseTime", [configTime.toNumber()]);
            await network.provider.send("evm_mine");

            await expect(compensationManager.connect(dapp).claimTimeoutCompensation(
                transactionId)).to.emit(compensationManager, "CompensationClaimed")
                .withArgs(
                    claimId,
                    dapp.address,
                    arbitrator.address,
                    STAKE_AMOUNT,
                    [],
                    STAKE_AMOUNT,
                    timeoutReceiver.address,
                    1);

            expect(await arbitratorManager.getAvailableStake(arbitrator.address)).to.equal(0);

            const transaction = await transactionManager.getTransactionById(transactionId);
            expect(transaction.status).to.equal(1);

            const compensationClaim = await compensationManager.claims(claimId);
            expect(compensationClaim.claimer).to.equal(dapp.address);
            expect(compensationClaim.arbitrator).to.equal(arbitrator.address);
            expect(compensationClaim.claimType).to.equal(1);
            expect(compensationClaim.withdrawn).to.equal(false);
            expect(compensationClaim.ethAmount).to.equal(STAKE_AMOUNT);
            expect(compensationClaim.totalAmount).to.equal(STAKE_AMOUNT);
            expect(compensationClaim.receivedCompensationAddress).to.equal(timeoutReceiver.address);
        });

        it("should revert with not timeout", async function () {
            await network.provider.send("evm_increaseTime", [1000]);
            await network.provider.send("evm_mine");

            await expect(compensationManager.connect(dapp).claimTimeoutCompensation(
                transactionId)).to.be.revertedWith("M3");
        });

        it("should revert with already claimed", async function () {
            const configTime = await configManager.getArbitrationTimeout();
            await network.provider.send("evm_increaseTime", [configTime.toNumber()]);
            await network.provider.send("evm_mine");

            await compensationManager.connect(dapp).claimTimeoutCompensation(transactionId)
            await expect(compensationManager.connect(dapp).claimTimeoutCompensation(
                transactionId)).to.be.revertedWith("M9");
        });
        it("should revert with not in arbitration", async function () {
            await transactionManager.connect(arbitrator).submitArbitration(transactionId, VALID_SIGNATURE);
            await expect(compensationManager.connect(dapp).claimTimeoutCompensation(
                transactionId)).to.be.revertedWith("M2");
        });
    });

    describe("withdrawCompensation", function () {
        let claimId;
        let withdrawFee;
        beforeEach(async function () {
            await transactionManager.connect(dapp).requestArbitration(
                transactionId,
                VALID_BTC_TX,
                1,
                "0xab2348",
                timeoutReceiver.address
            );
            const valid_evidence = ethers.utils.solidityKeccak256(
                ["bytes32", "uint8", "bytes", "bytes"],
                [VALID_TX_HASH, 0, VALID_SIGNATURE, VALID_PUB_KEY]
            );
            await validationService.submitFailedData(
                VALID_TX_HASH,
                0,
                VALID_SIGNATURE,
                VALID_PUB_KEY
            );
            await transactionManager.connect(arbitrator).submitArbitration(
                transactionId,
                VALID_SIGNATURE);
            await compensationManager.connect(dapp).claimFailedArbitrationCompensation(
                valid_evidence
            );
            claimId = ethers.utils.solidityKeccak256(
                ["bytes32", "address", "address", "uint8"],
                [valid_evidence, arbitrator.address, compensationReceiver.address, 2]
              );
            const feeRate = await configManager.getSystemCompensationFeeRate();
            withdrawFee = STAKE_AMOUNT.mul(feeRate).div(10000);
        });

        it("should withdraw successfully", async function () {
            await expect(compensationManager.connect(compensationReceiver).withdrawCompensation(claimId, {value: withdrawFee}))
                .to.emit(compensationManager, "CompensationWithdrawn").withArgs(
                    claimId,
                    compensationReceiver.address,
                    compensationReceiver.address,
                    STAKE_AMOUNT,
                    [],
                    withdrawFee,
                    0
                );
        });

        it("should withdraw successfully with correct amount", async function () {
            const balanceBefore = await ethers.provider.getBalance(compensationReceiver.address);

            const tx = await compensationManager.connect(compensationReceiver).withdrawCompensation(claimId, {value: withdrawFee});
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed;
            const gasPrice = receipt.effectiveGasPrice;
            const txFee = gasUsed.mul(gasPrice);

            const balanceAfter = await ethers.provider.getBalance(compensationReceiver.address);
            expect(balanceAfter.sub(balanceBefore)).to.equal(STAKE_AMOUNT.sub(withdrawFee).sub(txFee));
        });

        it("should withdraw successfully by other account with correct amount", async function () {
            const balanceBefore = await ethers.provider.getBalance(compensationReceiver.address);

            await compensationManager.connect(owner).withdrawCompensation(claimId, {value: withdrawFee});

            const balanceAfter = await ethers.provider.getBalance(compensationReceiver.address);
            expect(balanceAfter.sub(balanceBefore)).to.equal(STAKE_AMOUNT);
        });

        it("should revert with withdrawn", async function () {
            await compensationManager.connect(compensationReceiver).withdrawCompensation(claimId, {value: withdrawFee});
            await expect(compensationManager.connect(compensationReceiver).withdrawCompensation(claimId, {value: withdrawFee}))
                .to.be.revertedWith("M4");
        });
    });

    describe("claimArbitratorFee", function () {
        let claimId;
        beforeEach(async function () {
            await transactionManager.connect(dapp).requestArbitration(
                transactionId,
                VALID_BTC_TX,
                1,
                "0xab2348",
                timeoutReceiver.address
            );

            claimId = ethers.utils.solidityKeccak256(
                ["bytes32", "address", "address", "uint8"],
                [transactionId, arbitrator.address, arbitrator.address, 3]);
        });
        it("should claim successfully", async function () {
            await transactionManager.connect(arbitrator).submitArbitration(
                transactionId,
                VALID_SIGNATURE);

            const frozen = await configManager.getArbitrationFrozenPeriod();
            await network.provider.send("evm_increaseTime", [frozen.toNumber()]);
            await network.provider.send("evm_mine");

            await expect(compensationManager.connect(arbitrator).claimArbitratorFee(transactionId))
                .to.emit(compensationManager, "CompensationClaimed");

            const compensationClaim = await compensationManager.claims(claimId);
            expect(compensationClaim.claimer).to.equal(arbitrator.address);
            expect(compensationClaim.arbitrator).to.equal(arbitrator.address);
            expect(compensationClaim.claimType).to.equal(3);
            expect(compensationClaim.withdrawn).to.equal(true);
            expect(compensationClaim.receivedCompensationAddress).to.equal(arbitrator.address);

            const transaction = await transactionManager.getTransactionById(transactionId);
            expect(transaction.status).to.equal(1);

            expect(await arbitratorManager.isActiveArbitrator(arbitrator.address)).to.equal(true);
        });
        it("should revert with not tx arbitrator", async function () {
            await expect(compensationManager.connect(dapp).claimArbitratorFee(transactionId))
                .to.be.revertedWith("M1");
        });
        it("should revert with invalid tx status", async function () {
            await expect(compensationManager.connect(arbitrator).claimArbitratorFee(transactionId))
                .to.be.revertedWith("T2");
        });
        it("should revert because of frozen", async function () {
            await transactionManager.connect(arbitrator).submitArbitration(
                transactionId,
                VALID_SIGNATURE);

            await expect(compensationManager.connect(arbitrator).claimArbitratorFee(transactionId))
                .to.be.revertedWith("T2");
        });
        it("should revert because of arbitrated but not submitted", async function () {
            await expect(compensationManager.connect(arbitrator).claimArbitratorFee(transactionId))
                .to.be.revertedWith("T2");
        });
    });
    describe("claimArbitratorFee Active transaction", function () {
        it("should revert because of active tx not expired", async function () {
            await expect(compensationManager.connect(arbitrator).claimArbitratorFee(transactionId))
                .to.be.revertedWith("T2");
        });
        it("should claim successfully", async function () {
            await network.provider.send("evm_increaseTime", [duration]);
            await network.provider.send("evm_mine");

            await expect(compensationManager.connect(arbitrator).claimArbitratorFee(transactionId))
                .to.emit(compensationManager, "CompensationClaimed");

            let claimId = ethers.utils.solidityKeccak256(
                ["bytes32", "address", "address", "uint8"],
                [transactionId, arbitrator.address, arbitrator.address, 3]);
            const compensationClaim = await compensationManager.claims(claimId);
            expect(compensationClaim.claimer).to.equal(arbitrator.address);
            expect(compensationClaim.arbitrator).to.equal(arbitrator.address);
            expect(compensationClaim.claimType).to.equal(3);
            expect(compensationClaim.withdrawn).to.equal(true);
            expect(compensationClaim.receivedCompensationAddress).to.equal(arbitrator.address);

            const transaction = await transactionManager.getTransactionById(transactionId);
            expect(transaction.status).to.equal(1);

            expect(await arbitratorManager.isActiveArbitrator(arbitrator.address)).to.equal(true);
        });
    });
});
