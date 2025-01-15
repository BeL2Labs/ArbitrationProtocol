const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const {sleep} = require("../scripts/helper.js");

describe("TransactionManager", function () {
    let transactionManager;
    let arbitratorManager;
    let dappRegistry;
    let configManager;
    let compensationManager;
    let owner;
    let dapp;
    let arbitrator;
    let operator;
    let other;
    let compensationReceiver;

    const STAKE_AMOUNT = ethers.utils.parseEther("10");
    const MIN_STAKE = ethers.utils.parseEther("10");
    const MIN_TRANSACTION_DURATION = 24 * 60 * 60; // 1 day
    const MAX_TRANSACTION_DURATION = 30 * 24 * 60 * 60; // 30 days

    beforeEach(async function () {
        [owner, dapp, arbitrator, other] = await ethers.getSigners();
        operator = owner;
        compensationReceiver=owner;
        other = arbitrator;
        console.log("Owner address:", owner.address);
        console.log("DApp address:", dapp.address);
        console.log("Arbitrator address:", arbitrator.address);
        // Deploy ConfigManager
        const ConfigManager = await ethers.getContractFactory("ConfigManager");
        configManager = await upgrades.deployProxy(ConfigManager, [], { initializer: 'initialize' });
        // Deploy DAppRegistry
        const DAppRegistry = await ethers.getContractFactory("DAppRegistry");
        dappRegistry = await upgrades.deployProxy(DAppRegistry, [configManager.address], { initializer: 'initialize' });
        // Deploy ArbitratorManager
        const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager");
        arbitratorManager = await upgrades.deployProxy(ArbitratorManager, [
            configManager.address, 
            owner.address,  // Temporary NFT contract address
            owner.address   // Temporary NFT info contract address
        ], { initializer: 'initialize' });

        const MockSignatureValidationService = await ethers.getContractFactory("MockSignatureValidationService");
        const validationService = await MockSignatureValidationService.deploy();
        // Deploy CompensationManager
        const CompensationManager = await ethers.getContractFactory("CompensationManager");
        compensationManager = await upgrades.deployProxy(CompensationManager, [
            owner.address, // Mock ZkService not needed for this test
            configManager.address,
            arbitratorManager.address,
            validationService.address 
        ], { initializer: 'initialize' });

        // Deploy TransactionManager
        const TransactionManager = await ethers.getContractFactory("TransactionManager");
        transactionManager = await upgrades.deployProxy(TransactionManager, [
            arbitratorManager.address,
            dappRegistry.address,
            configManager.address,
            compensationManager.address
        ], { initializer: 'initialize' });

        // Set transactionManager
        await compensationManager.connect(owner).setTransactionManager(transactionManager.address);

        // Set minimum transaction duration in ConfigManager
        await configManager.setMinTransactionDuration(MIN_TRANSACTION_DURATION);
        await configManager.setMaxTransactionDuration(MAX_TRANSACTION_DURATION);

        // Register DApp
        await dappRegistry.connect(owner).registerDApp(dapp.address,{value: ethers.utils.parseEther("10")});
        await dappRegistry.connect(owner).authorizeDApp(dapp.address);

        // Register Arbitrator
        const btcAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
        const btcPubKey = ethers.utils.arrayify("0x03f028892bad7ed57d2fb57bf33081d5cfcf6f9ed3d3d7f159c2e2fff579dc341a");
        const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now
        const feeRate = 1000; // 10%
        console.log("Before Register arbitrator result:");
        let tx = await arbitratorManager.connect(arbitrator).registerArbitratorByStakeETH(
            btcAddress,
            btcPubKey,
            feeRate,
            deadline,
            { value: STAKE_AMOUNT }
        );
        let receipt = await tx.wait();
        console.log("Register arbitrator result:", tx.hash)

        // Ensure arbitrator is active
        const isActiveArbitrator = await arbitratorManager.isActiveArbitrator(arbitrator.address);
        let info = await arbitratorManager.getArbitratorInfo(arbitrator.address);
        expect(isActiveArbitrator).to.be.true;

        // Set TransactionManager as the transaction manager in ArbitratorManager
        tx = await arbitratorManager.connect(owner).initTransactionAndCompensationManager(transactionManager.address, compensationManager.address);
        receipt = await tx.wait();
        console.log("setTransactionManager:", tx.hash);
    });
   
    describe("Transaction Registration", async function () {
        it ("Should get available stake", async function () {
            const availableStake = await arbitratorManager.getAvailableStake(arbitrator.address);
            expect(availableStake).to.equal(STAKE_AMOUNT);
        });
        it("Should register a transaction with valid parameters", async function () {
            const deadline = (await time.latest()) + 2 * 24 * 60 * 60; // 2 days from now
            console.log("Deadline:", deadline);
            const registerTx = await transactionManager.connect(dapp).registerTransaction(
                arbitrator.address,
                deadline,
                compensationReceiver.address,
                { value: ethers.utils.parseEther("0.1") } // Sufficient fee
            );
            console.log("registerTx:", registerTx.hash);
            const receipt = await registerTx.wait();
            const event = receipt.events.find(e => e.event === "TransactionRegistered");
            expect(event).to.exist;
        });

        it("Should fail to register transaction with zero address", async function () {
            const deadline = (await time.latest()) + 2 * 24 * 60 * 60; // 2 days from now

            await expect(
                transactionManager.connect(dapp).registerTransaction(
                    ethers.constants.AddressZero,
                    deadline,
                    compensationReceiver.address,
                    { value: ethers.utils.parseEther("0.1") }
                )
            ).to.be.revertedWith("Z0");
        });

        it("Should fail to register transaction with invalid deadline", async function () {
            const deadline = (await time.latest()) - 2 * 24 * 60 * 60; // 2 days in the past

            await expect(
                transactionManager.connect(dapp).registerTransaction(
                    arbitrator.address,
                    deadline,
                    compensationReceiver.address,
                    { value: ethers.utils.parseEther("0.1") }
                )
            ).to.be.revertedWith("T3");
        });

        it("Should fail to register transaction with insufficient fee", async function () {
            const deadline = (await time.latest()) + 2 * 24 * 60 * 60; // 2 days from now

            // Try to register with zero fee
            await expect(
                transactionManager.connect(dapp).registerTransaction(
                    arbitrator.address,
                    deadline,
                    compensationReceiver.address,
                    { value: 0 } // Zero fee
                )
            ).to.be.revertedWith("T5");
        });
    });

    describe("Transaction Upload utxos", function () {
        beforeEach(async function () {
            const deadline = (await time.latest()) + 2 * 24 * 60 * 60; // 2 days from now

            const registerTx = await transactionManager.connect(dapp).registerTransaction(
                arbitrator.address,
                deadline,
                compensationReceiver.address,
                { value: ethers.utils.parseEther("0.1") }
            );

            const receipt = await registerTx.wait();
            const event = receipt.events.find(e => e.event === "TransactionRegistered");
            transactionId = event.args[0];
            console.log("Transaction ID:", transactionId);
        });

        it("Should upload utxos successfully", async function () {
            const utxos = [
                {
                    txHash: ethers.utils.randomBytes(32),
                    index: 0,
                    script: ethers.utils.randomBytes(20),
                    amount: ethers.utils.parseEther("1")
                }
            ];
            expect(await transactionManager.connect(dapp).uploadUTXOs(transactionId, utxos))
                .to.emit(transactionManager, "UtxosUploaded").withArgs(transactionId, dapp.address, utxos);
        });

        it("Should upload utxos fail with not authorized", async function () {
            const utxos = [
                {
                    txHash: ethers.utils.randomBytes(32),
                    index: 0,
                    script: ethers.utils.randomBytes(20),
                    amount: ethers.utils.parseEther("1")
                }
            ];
            await expect(transactionManager.connect(owner).uploadUTXOs(transactionId, utxos))
                .to.be.revertedWith("N0");
        });

        it("Should upload utxos twice failed", async function () {
            const utxos = [
                {
                    txHash: ethers.utils.randomBytes(32),
                    index: 0,
                    script: ethers.utils.randomBytes(20),
                    amount: ethers.utils.parseEther("1")
                }
            ];
            await transactionManager.connect(dapp).uploadUTXOs(transactionId, utxos);
            await expect(transactionManager.connect(dapp).uploadUTXOs(transactionId, utxos))
                .to.be.revertedWith("U2");
        });

        it("Should upload utxos failed after completed", async function () {
            const utxos = [
                {
                    txHash: ethers.utils.randomBytes(32),
                    index: 0,
                    script: ethers.utils.randomBytes(20),
                    amount: ethers.utils.parseEther("1")
                }
            ];
            await transactionManager.connect(dapp).completeTransaction(transactionId);
            await expect(transactionManager.connect(dapp).uploadUTXOs(transactionId, utxos))
                .to.be.revertedWith("T2");
        });
    });

    describe("Transaction Request Arbitration", async function () {
        beforeEach(async function () {
            const deadline = (await time.latest()) + 2 * 24 * 60 * 60; // 2 days from now

            const registerTx = await transactionManager.connect(dapp).registerTransaction(
                arbitrator.address,
                deadline,
                compensationReceiver.address,
                { value: ethers.utils.parseEther("0.1") }
            );

            const receipt = await registerTx.wait();
            const event = receipt.events.find(e => e.event === "TransactionRegistered");
            transactionId = event.args[0];
            console.log("Transaction ID:", transactionId);

            const utxos = [
                {
                    txHash: "0x0c07be21efcb2dd82f24892270b40f44f57686896082c6fb373d3c66722189e2",
                    index: 0,
                    script: ethers.utils.randomBytes(20),
                    amount: ethers.utils.parseEther("1")
                }
            ];
            await transactionManager.connect(dapp).uploadUTXOs(transactionId, utxos);
        });

        it ("Should request arbitration successfully", async function () {
            const signData = "0x02000000e5cd49421a525ae552acc8abd1d126108317aa517d96cd8550895d10486819da8cb9012517c817fead650287d61bdd9c68803b6bf9c64133dcab3e65b5a50cb9e2892172663c3d37fbc68260898676f5440fb4702289242fd82dcbef21be070c00000000fd0a0163210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac6763210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad2102b32f28976aa0be56a9de7cb7764c31c62a8d844244d9a5ecbe348e97e85475dfac676303b60040b275210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ada8205a0737e8cbcfa24dcc118b0ab1e6d98bee17c57daa8a1686024159aae707ed6f876703bd0040b275210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac686868692900000000000000000000c19695b1d2324599c15f4b3b47c0379b9a0c8b10512fc69cc93abf09f8afa3fe0000000001000000";
            const signHash = "0x3b07965292e50272b6ee3ba2c89fea4c6f626e8ad01a25dd509f97b53d88d581";
            await expect(transactionManager.connect(dapp).requestArbitration(
                transactionId, signData, 1, "0xab2348", dapp.address))
                .emit(transactionManager, "ArbitrationRequested");
            
            const transaction = await transactionManager.getTransactionById(transactionId);
            expect(transaction.status).to.equal(2);
            expect(transaction.arbitrator).to.equal(arbitrator.address);
            expect(transaction.btcTx).to.equal(signData);
            expect(transaction.btcTxHash).to.equal(signHash);
            expect(transaction.timeoutCompensationReceiver).to.equal(dapp.address);

            expect(await transactionManager.txHashToId(signHash)).to.equal(transactionId);
        });
    });

    describe("Transaction Completion", function () {
        let transactionId;

        beforeEach(async function () {
            const deadline = (await time.latest()) + 2 * 24 * 60 * 60; // 2 days from now

            const registerTx = await transactionManager.connect(dapp).registerTransaction(
                arbitrator.address,
                deadline,
                compensationReceiver.address,
                { value: ethers.utils.parseEther("0.1") }
            );

            const receipt = await registerTx.wait();
            const event = receipt.events.find(e => e.event === "TransactionRegistered");
            transactionId = event.args[0];
            console.log("Transaction ID:", transactionId);
        });

        it("Should allow transaction completion by DApp", async function () {
            await expect(
                await transactionManager.connect(dapp).completeTransaction(transactionId)
            ).to.emit(transactionManager, "TransactionCompleted");

            // Check status (Completed is 3)
            let transaction = await transactionManager.getTransactionById(transactionId);
            expect(transaction.status).to.equal(1);//completed

            let isActive = await arbitratorManager.isActiveArbitrator(arbitrator.address);
            expect(isActive).to.equal(true);//active
        });

        it("Should fail to complete transaction by non-DApp", async function () {
            await expect(
                transactionManager.connect(other).completeTransaction(transactionId)
            ).to.be.revertedWith("N0");
        });
    });
});
