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
        // Deploy TransactionManager
        const TransactionManager = await ethers.getContractFactory("TransactionManager");
        transactionManager = await upgrades.deployProxy(TransactionManager, [
            arbitratorManager.address,
            dappRegistry.address,
            configManager.address
        ], { initializer: 'initialize' });
        // Deploy CompensationManager
        const CompensationManager = await ethers.getContractFactory("CompensationManager");
        compensationManager = await upgrades.deployProxy(CompensationManager, [
            owner.address, // Mock ZkService not needed for this test
            transactionManager.address,
            configManager.address,
            arbitratorManager.address
        ], { initializer: 'initialize' });
        // Initialize compensation manager in TransactionManager
        await transactionManager.initCompensationManager(compensationManager.address);

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
            const utxos = [{
                txHash: ethers.utils.randomBytes(32),
                index: 0,
                script: ethers.utils.randomBytes(20),
                amount: ethers.utils.parseEther("1")
            }];
            const deadline = (await time.latest()) + 2 * 24 * 60 * 60; // 2 days from now
            console.log("Deadline:", deadline);
            const registerTx = await transactionManager.connect(dapp).registerTransaction(
                utxos,
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
            const utxos = [{
                txHash: ethers.utils.randomBytes(32),
                index: 0,
                script: ethers.utils.randomBytes(20),
                amount: ethers.utils.parseEther("1")
            }];
            const deadline = (await time.latest()) + 2 * 24 * 60 * 60; // 2 days from now

            await expect(
                transactionManager.connect(dapp).registerTransaction(
                    utxos,
                    ethers.constants.AddressZero,
                    deadline,
                    compensationReceiver.address,
                    { value: ethers.utils.parseEther("0.1") }
                )
            ).to.be.revertedWith("Zero address");
        });

        it("Should fail to register transaction with invalid deadline", async function () {
            const utxos = [{
                txHash: ethers.utils.randomBytes(32),
                index: 0,
                script: ethers.utils.randomBytes(20),
                amount: ethers.utils.parseEther("1")
            }];
            const deadline = (await time.latest()) - 2 * 24 * 60 * 60; // 2 days in the past

            await expect(
                transactionManager.connect(dapp).registerTransaction(
                    utxos,
                    arbitrator.address,
                    deadline,
                    compensationReceiver.address,
                    { value: ethers.utils.parseEther("0.1") }
                )
            ).to.be.revertedWith("Invalid deadline");
        });

        it("Should fail to register transaction with insufficient fee", async function () {
            const utxos = [{
                txHash: ethers.utils.randomBytes(32),
                index: 0,
                script: ethers.utils.randomBytes(20),
                amount: ethers.utils.parseEther("1")
            }];
            const deadline = (await time.latest()) + 2 * 24 * 60 * 60; // 2 days from now

            // Try to register with zero fee
            await expect(
                transactionManager.connect(dapp).registerTransaction(
                    utxos,
                    arbitrator.address,
                    deadline,
                    compensationReceiver.address,
                    { value: 0 } // Zero fee
                )
            ).to.be.revertedWith("Insufficient fee");
        });
    });

    describe("Transaction Completion", function () {
        let transactionId;

        beforeEach(async function () {
            const utxos = [{
                txHash: ethers.utils.randomBytes(32),
                index: 0,
                script: ethers.utils.randomBytes(20),
                amount: ethers.utils.parseEther("1")
            }];
            const deadline = (await time.latest()) + 2 * 24 * 60 * 60; // 2 days from now

            const registerTx = await transactionManager.connect(dapp).registerTransaction(
                utxos,
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

            let arbitratorInfo = await arbitratorManager.getArbitratorInfo(arbitrator.address);
            expect(arbitratorInfo.status).to.equal(0);//active
            console.log("completed transaction arbitratorInfo.status:", arbitratorInfo.status, "transactionId ", transactionId);
            
        });

        it("Should fail to complete transaction by non-DApp", async function () {
            await expect(
                transactionManager.connect(other).completeTransaction(transactionId)
            ).to.be.revertedWith("Not authorized");
        });
    });
});
