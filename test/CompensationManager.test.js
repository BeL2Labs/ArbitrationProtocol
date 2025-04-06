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

    const VALID_BTC_TX = "0x02000000000101929119c4ba3c6e4b3f40474bb14d3d8610593fc4cda68288a69e91cfa363a1ad00000000000000000001a01b0000000000001976a914cb539f4329eeb589e83659c8304bcc6c99553a9688ac05483045022100f1296c9b96f1029d6b74782c9a827ee334a773e33d3a3593816543594ffd1b940220453bfa91aec7a445619cea8f3a5219945260d5ef529d6e02f399318eed96e6a901473044022007974847cf4d0397b4ca736e92e8c3ada42dc8f1c2cb2f98b0038e9967be684f0220241464a067fe1bb3ffbecb178a12004993ec0f51ea9dfc09521096f855f3f3d201010100fd0a016321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad210249d5b1a12045ff773b85033d3396faa32fd579cee25c4f7bb6aef6103228bd72ac676321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad21036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac676303ab0440b275210249d5b1a12045ff773b85033d3396faa32fd579cee25c4f7bb6aef6103228bd72ada820c7edc93e03202c56d1067d602476e3dd982689b0a6be6a44d016404926cd66ce876703b20440b27521036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac68686800000000";
    const VALID_SIGNATURE = "0x30440220287e9e41c54b48c30e46ea442aa80ab793dac56d3816dbb2a5ea465f0c6e26e1022079aed874e9774b23c98ad9a60b38f37918591d50af83f49b92e63b9ce74fdedf";
    const VALID_TX_HASH = "0x74c0acaefebca6bf4221bf8d2bb86b4d69fb2273a95a1aee4683f5db08bd3eca";
    const VALID_PUB_KEY = "0x02098cf93afc2c0682e0b6d7e132f9fbeedc610dc1c0d09dbcd75db1892f975641";
    const VALID_UTXOS = [{
        txHash: "0xada163a3cf919ea68882a6cdc43f5910863d4db14b47403f4b6e3cbac4199192",
        index: 0,
        script: "0x00200a00f7c850b180f51bbb20f59e87f00150fda6974c04059fab771f04b300e97e",
        amount: 7922
    }];
    const VALID_EVIDENCE = "0xa8a0b55bd00df1287445685c7c4a7e0a3df8edd82fee186cfcfda436f2924cea";
    const STAKE_AMOUNT = ethers.utils.parseEther("1.0");

    beforeEach(async function () {
        [owner, dapp, arbitrator, user, user1, compensationReceiver, timeoutReceiver] = await ethers.getSigners();
        if (!user) {
            user = owner;
            user1 = owner;
            compensationReceiver = dapp;
            timeoutReceiver = dapp;
        }
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
        // Deploy MockAssetOracle
        const MockOracle = await ethers.getContractFactory("MockAssetOracle");
        const mockOracle = await MockOracle.deploy();
        arbitratorManager = await upgrades.deployProxy(ArbitratorManager, [
            configManager.address,
            mockNFT.address,
            mockNFTInfo.address,
            mockOracle.address
        ], { initializer: 'initialize' });

        compensationManager = await upgrades.deployProxy(CompensationManager, [
            zkService.address,
            configManager.address,
            arbitratorManager.address,
            validationService.address
        ], { initializer: 'initialize' });

        const BTCUtils = await ethers.getContractFactory("BTCUtils");
        const btcUtils = await BTCUtils.deploy();
        await btcUtils.deployed();

        const BTCAddressParser = await ethers.getContractFactory("MockBtcAddress");
        const btcAddressParser = await BTCAddressParser.deploy();
        await btcAddressParser.deployed();
        transactionManager = await upgrades.deployProxy(TransactionManager, [
            arbitratorManager.address,
            dappRegistry.address,
            configManager.address,
            compensationManager.address,
            btcUtils.address,
            btcAddressParser.address
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

        const btcAddress = "1KY6M7H6hvEexW9QFqeTHzbZGuCXgAjxUn";
        const btcScript = "0x76a914cb539f4329eeb589e83659c8304bcc6c99553a9688ac";
        const deadline = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 356 days from now
        const feeRate = 1000; // 10%
        const btcFeeRate = 0;
        let tx = await arbitratorManager.connect(arbitrator).registerArbitratorByStakeETH(
            btcAddress,
            VALID_PUB_KEY,
            feeRate,
            btcFeeRate,
            deadline,
            { value: STAKE_AMOUNT }
        );
        await tx.wait();
        await btcAddressParser.connect(owner).setBtcAddressToScript(btcAddress, btcScript);

        const data = {
            arbitrator: arbitrator.address,
            deadline: Math.floor(Date.now() / 1000) + duration, // 30 days from now
            compensationReceiver: compensationReceiver.address,
            refundAddress: dapp.address,
        }
        const registerTx = await transactionManager.connect(dapp).registerTransaction(
            data,
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

            const transaction = await transactionManager.getTransactionDataById(transactionId);
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
            let arbitrationData = {
                id: transactionId,
                rawData: VALID_BTC_TX,
                signDataType: 1,
                signHashFlag: 1,
                script: "0xab2348",
                timeoutCompensationReceiver: user.address
            }

            await transactionManager.connect(dapp).requestArbitration(
                arbitrationData
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
           let arbitrationData = {
               id: transactionId,
               rawData: VALID_BTC_TX,
               signDataType: 1,
               signHashFlag: 1,
               script: "0xab2348",
               timeoutCompensationReceiver: timeoutReceiver.address
           }
           await transactionManager.connect(dapp).requestArbitration(arbitrationData);
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
               [valid_evidence, arbitrator.address, timeoutReceiver.address, 2]
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

           const transaction = await transactionManager.getTransactionDataById(transactionId);
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
           let arbitrationData = {
               id: transactionId,
               rawData: VALID_BTC_TX,
               signDataType: 1,
               signHashFlag: 1,
               script: "0xab2348",
               timeoutCompensationReceiver: timeoutReceiver.address
           }
           await transactionManager.connect(dapp).requestArbitration(
               arbitrationData
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

           const transaction = await transactionManager.getTransactionDataById(transactionId);
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
           let arbitrationData = {
               id: transactionId,
               rawData: VALID_BTC_TX,
               signDataType: 1,
               signHashFlag: 1,
               script: "0xab2348",
               timeoutCompensationReceiver: timeoutReceiver.address
           }
           await transactionManager.connect(dapp).requestArbitration(
               arbitrationData
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
               [valid_evidence, arbitrator.address, timeoutReceiver.address, 2]
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
            let arbitrationData = {
                id: transactionId,
                rawData: VALID_BTC_TX,
                signDataType: 1,
                signHashFlag: 1,
                script: "0xab2348",
                timeoutCompensationReceiver: timeoutReceiver.address
            }
            await transactionManager.connect(dapp).requestArbitration(
                arbitrationData
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

            const transaction = await transactionManager.getTransactionDataById(transactionId);
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

            const transaction = await transactionManager.getTransactionDataById(transactionId);
            expect(transaction.status).to.equal(1);

            expect(await arbitratorManager.isActiveArbitrator(arbitrator.address)).to.equal(true);
        });
    });
});
