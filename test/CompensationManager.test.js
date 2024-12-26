const { expect } = require("chai");
const { ethers } = require("hardhat");
const { upgrades } = require("hardhat");
const {sleep} = require("../scripts/helper");

describe("CompensationManager", function () {
    let zkService;
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
    let transactionId;

    const VALID_BTC_TX = "0x1234567890";
    const VALID_RAW_DATA = "0x1234567890";
    const VALID_SIGNATURE = "0xabcdef1234";
    const VALID_TX_HASH = ethers.utils.keccak256("0x1234");
    const STAKE_AMOUNT = ethers.utils.parseEther("1.0");

    beforeEach(async function () {
        [owner, dapp, arbitrator, user, user1] = await ethers.getSigners();
        user = arbitrator;
        user1 = arbitrator;
        // Deploy mock contracts
        const MockZkService = await ethers.getContractFactory("MockZkService");
        const MockNFT = await ethers.getContractFactory("MockNFT");
        const MockNFTInfo = await ethers.getContractFactory("MockNFTInfo");
        const ConfigManager = await ethers.getContractFactory("ConfigManager");
        const DappRegistry = await ethers.getContractFactory("DAppRegistry");
        const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager");
        const TransactionManager = await ethers.getContractFactory("TransactionManager");
        const CompensationManager = await ethers.getContractFactory("CompensationManager");

        // Deploy contracts
        zkService = await MockZkService.deploy();
        mockNFT = await MockNFT.deploy();
        mockNFTInfo = await MockNFTInfo.deploy();
        configManager = await upgrades.deployProxy(ConfigManager, [], { initializer: 'initialize' });
        dappRegistry = await upgrades.deployProxy(DappRegistry, [configManager.address], { initializer: 'initialize' });
        arbitratorManager = await upgrades.deployProxy(ArbitratorManager, [
            configManager.address,
            mockNFT.address,
            mockNFTInfo.address
        ], { initializer: 'initialize' });
        transactionManager = await upgrades.deployProxy(TransactionManager, [
            arbitratorManager.address,
            dappRegistry.address,
            configManager.address
        ], { initializer: 'initialize' });
        compensationManager = await upgrades.deployProxy(CompensationManager, [
            zkService.address,
            transactionManager.address,
            configManager.address,
            arbitratorManager.address
        ], { initializer: 'initialize' });
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
        const btcPubKey = ethers.utils.arrayify("0x03f028892bad7ed57d2fb57bf33081d5cfcf6f9ed3d3d7f159c2e2fff579dc341a");
        const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now
        const feeRate = 1000; // 10%
        let tx = await arbitratorManager.connect(arbitrator).registerArbitratorByStakeETH(
            btcAddress,
            btcPubKey,
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

        const utxos = [{
            txHash: ethers.utils.randomBytes(32),
            index: 0,
            script: ethers.utils.randomBytes(20),
            amount: ethers.utils.parseEther("1")
        }];

        const registerTx = await transactionManager.connect(dapp).registerTransaction(
            utxos,
            arbitrator.address,
            Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
            owner.address,
            { value: ethers.utils.parseEther("0.1") }
        );
        const receipt = await registerTx.wait();
        const event = receipt.events.find(e => e.event === "TransactionRegistered");
        transactionId = event.args[0];
    });

    describe("claimIllegalSignatureCompensation", function () {
        it("should succeed with valid verification data", async function () {
            const evidence = ethers.utils.keccak256("0x5678");

            // Get arbitrator details
            const arbitratorInfo = await arbitratorManager.getArbitratorInfo(arbitrator.address);

            // Set up valid verification data
            const VALID_PUB_KEY = arbitratorInfo.operatorBtcPubKey;
            
            await zkService.setValidVerification(
                evidence,
                VALID_BTC_TX,
                VALID_PUB_KEY,
                VALID_TX_HASH,
                VALID_SIGNATURE
            );

            let verification = await zkService.getZkVerification(evidence);
            expect(verification.rawData).to.equal(VALID_BTC_TX);
            expect(verification.pubKey).to.equal(VALID_PUB_KEY);
            expect(verification.txHash).to.equal(VALID_TX_HASH);
            expect(verification.signature).to.equal(VALID_SIGNATURE);
            expect(verification.verified).to.be.true;

            // Claim compensation
            const claimTx = await compensationManager.connect(dapp).claimIllegalSignatureCompensation(
                arbitrator.address,
                VALID_BTC_TX,  // Pass the BTC transaction
                evidence
            );
            
            // Verify events and claim details
            const receipt = await claimTx.wait();
            const claimEvent = receipt.events.find(e => e.event === 'CompensationClaimed');
            expect(claimEvent).to.exist;
            expect(claimEvent.args[2]).to.equal(0); // IllegalSignature type
        });

    describe("Compensation Claim Scenarios", function () {
        let evidence;
        let txHash;

        beforeEach(async function () {
            // Prepare common test data
            evidence = ethers.utils.keccak256("0x5678");
            txHash = ethers.utils.keccak256("0x1234");
        });

        describe("Illegal Signature Compensation", function () {
            let VALID_PUB_KEY;

            beforeEach(async function () {
                // Get arbitrator details
                const arbitratorInfo = await arbitratorManager.getArbitratorInfo(arbitrator.address);
                VALID_PUB_KEY = arbitratorInfo.operatorBtcPubKey;

                // Ensure arbitrator is active by registering or setting status
                if (arbitratorInfo.arbitrator === ethers.constants.AddressZero) {
                    // If not registered, register the arbitrator
                    let tx = await arbitratorManager.connect(arbitrator).registerArbitratorByStakeETH(
                        arbitrator.address, // operator
                        arbitrator.address, // revenue address
                        "testBtcAddress", // btc address
                        VALID_PUB_KEY, // btc pub key
                        1000, // fee rate
                        Math.floor(Date.now() / 1000) + 1000 // deadline
                    );
                    console.log("registerArbitratorByStakeETH tx ", tx.hash);
                }
            });
       
            it("should succeed with valid verification data", async function () {
                // Set up valid verification data
                await zkService.setValidVerification(
                    evidence,
                    VALID_RAW_DATA,
                    VALID_PUB_KEY,
                    txHash,
                    VALID_SIGNATURE
                );

                // Claim compensation
                const claimTx = await compensationManager.connect(dapp).claimIllegalSignatureCompensation(
                    arbitrator.address,
                    VALID_RAW_DATA,
                    evidence
                );

                // Verify events and claim details
                const receipt = await claimTx.wait();
                const claimEvent = receipt.events.find(e => e.event === 'CompensationClaimed');
                expect(claimEvent).to.exist;
                expect(claimEvent.args[2]).to.equal(0); // IllegalSignature type
            });

            it("should revert with empty raw data", async function () {
                await zkService.setEmptyRawData(evidence);

                await expect(
                    compensationManager.connect(dapp).claimIllegalSignatureCompensation(
                        arbitrator.address,
                        VALID_RAW_DATA,
                        evidence
                    )
                ).to.be.revertedWith("Invalid verification data");
            });

            it("should revert with empty public key", async function () {
                await zkService.setEmptyPubKey(evidence);

                await expect(
                    compensationManager.connect(dapp).claimIllegalSignatureCompensation(
                        arbitrator.address,
                        VALID_RAW_DATA,
                        evidence
                    )
                ).to.be.revertedWith("Invalid verification data");
            });

            it("should revert with empty tx hash", async function () {
                await zkService.setEmptyTxHash(evidence);

                await expect(
                    compensationManager.connect(dapp).claimIllegalSignatureCompensation(
                        arbitrator.address,
                        VALID_RAW_DATA,
                        evidence
                    )
                ).to.be.revertedWith("Invalid verification data");
            });

            it("should revert with invalid verification", async function () {
                await zkService.setInvalidVerification(
                    evidence,
                    VALID_RAW_DATA,
                    VALID_PUB_KEY,
                    txHash,
                    VALID_SIGNATURE
                );

                await expect(
                    compensationManager.connect(dapp).claimIllegalSignatureCompensation(
                        arbitrator.address,
                        VALID_RAW_DATA,
                        evidence
                    )
                ).to.be.revertedWith("Signature mismatch");
            });
        });

        describe("Timeout Compensation", function () {

            beforeEach(async function () {
                let tx = await transactionManager.connect(dapp).completeTransaction(transactionId)
                await tx.wait();

                // Get the minimum and maximum transaction duration
                await configManager.setMinTransactionDuration(1000);
                const minDuration = await configManager.getConfig(configManager.MIN_TRANSACTION_DURATION());
                const maxDuration = await configManager.getConfig(configManager.MAX_TRANSACTION_DURATION());
                console.log("minDuration: ", minDuration);
                console.log("maxDuration: ", maxDuration);
                const utxos = [{
                    txHash: ethers.utils.randomBytes(32),
                    index: 0,
                    script: ethers.utils.randomBytes(20),
                    amount: ethers.utils.parseEther("1")
                }];

                const currentTimestamp = Math.floor(Date.now() / 1000);
                const deadline = currentTimestamp  + minDuration.toNumber() + 200;
                console.log("deadline", deadline);
                const registerTx = await transactionManager.connect(dapp).registerTransaction(
                    utxos,
                    arbitrator.address,
                    deadline,
                    owner.address,
                    { value: ethers.utils.parseEther("0.1") }
                );
                const receipt = await registerTx.wait();
                const event = receipt.events.find(e => e.event === "TransactionRegistered");
                transactionId = event.args[0];

            });

            it("should succeed in claiming timeout compensation", async function () {
                const minDuration = await configManager.getConfig(configManager.MIN_TRANSACTION_DURATION());

                // Simulate time passing beyond the deadline
                await ethers.provider.send("evm_increaseTime", [minDuration.toNumber() + 300]);
                await ethers.provider.send("evm_mine");

                const claimTx = await compensationManager.connect(dapp).claimTimeoutCompensation(transactionId);
                const receipt = await claimTx.wait();
                const claimEvent = receipt.events.find(e => e.event === 'CompensationClaimed');

                expect(claimEvent).to.exist;
                expect(claimEvent.args[2]).to.equal(1); // Timeout type
                await ethers.provider.send("evm_increaseTime", [1]);
                await ethers.provider.send("evm_mine");
            });

        });

        describe("Withdrawal Compensation", function () {
            let claimId;
            let VALID_PUB_KEY;
            let evidence;
            let txHash;

            beforeEach(async function () {
                // Ensure arbitrator is registered and active
                const btcAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
                const btcPubKey = ethers.utils.arrayify("0x03f028892bad7ed57d2fb57bf33081d5cfcf6f9ed3d3d7f159c2e2fff579dc341a");
                const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now
                const feeRate = 1000; // 10%
                
                // Check arbitrator info after registration
                const arbitratorInfo = await arbitratorManager.getArbitratorInfo(arbitrator.address);
                console.log("Arbitrator Info:", {
                    address: arbitratorInfo.arbitrator,
                    zeroAddress: ethers.constants.AddressZero,
                    isZero: arbitratorInfo.arbitrator === ethers.constants.AddressZero,
                    operatorBtcPubKey: arbitratorInfo.operatorBtcPubKey
                });

                // Ensure arbitrator is not paused
                const isPaused = await arbitratorManager.isPaused(arbitrator.address);
                console.log("Is Arbitrator Paused:", isPaused);
                if (isPaused) {
                    await arbitratorManager.connect(arbitrator).unpause();
                }

                // Get arbitrator details
                VALID_PUB_KEY = arbitratorInfo.operatorBtcPubKey || btcPubKey;

                // Prepare test data
                evidence = ethers.utils.keccak256("0x5678");
                txHash = ethers.utils.keccak256("0x1234");

                // Set up a valid illegal signature claim
                await zkService.setValidVerification(
                    evidence,
                    VALID_RAW_DATA,
                    VALID_PUB_KEY,
                    txHash,
                    VALID_SIGNATURE
                );

                // Create a mock transaction for compensation address
                const mockUtxos = [{
                    txHash: ethers.utils.randomBytes(32),
                    index: 0,
                    script: ethers.utils.randomBytes(20),
                    amount: ethers.utils.parseEther("0.1")
                }];

                // Claim compensation
                const claimTx = await compensationManager.connect(dapp).claimIllegalSignatureCompensation(
                    arbitrator.address,
                    VALID_RAW_DATA,
                    evidence
                );
                const receipt = await claimTx.wait();
                const claimEvent = receipt.events.find(e => e.event === 'CompensationClaimed');
                claimId = claimEvent.args[0];
                console.log("claimID ", claimId);
            });

            it("should revert if claim does not exist", async function () {
                const nonExistentClaimId = ethers.utils.keccak256("0xcae972e5a60526a24dbc05cbf505a3400747ca34bc5eff2930f8bca15f3a9162");
                console.log("nonExistentClaimId",nonExistentClaimId);
                await expect(
                    compensationManager.connect(user).withdrawCompensation(nonExistentClaimId)
                ).to.be.revertedWith("No compensation available");
            });
        });
    });

    });
});
