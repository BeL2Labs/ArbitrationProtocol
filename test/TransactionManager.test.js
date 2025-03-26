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
    let btcAddressParser;
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

        const BTCUtils = await ethers.getContractFactory("BTCUtils");
        let btcUtils = await BTCUtils.deploy();
        await btcUtils.deployed();

        // Deploy BTC Address Parser
        const BTCAddressParser = await ethers.getContractFactory("MockBtcAddress");
        btcAddressParser = await BTCAddressParser.deploy();

        // Deploy MockAssetOracle
        const MockOracle = await ethers.getContractFactory("MockAssetOracle");
        const mockOracle = await MockOracle.deploy();
        // Deploy TransactionManager
        const TransactionManager = await ethers.getContractFactory("TransactionManager");
        transactionManager = await upgrades.deployProxy(TransactionManager, [
            arbitratorManager.address,
            dappRegistry.address,
            configManager.address,
            compensationManager.address,
            btcUtils.address,
            btcAddressParser.address,
            mockOracle.address
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
        const btcAddress = "1F9wDVq5ym2B3Z8bs1yBMSsd6oa9SbihJ4";
        const btcPubKey = ethers.utils.arrayify("0x0250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19");
        const btcScript = "0x76a9149b42587007f85e456b5d0d702e828f34ea1f55b188ac";
        const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now
        const feeRate = 0; // 10%
        const btcFeeRate = 1000; // 10%
        console.log("Before Register arbitrator result:");
        let tx = await arbitratorManager.connect(arbitrator).registerArbitratorByStakeETH(
            btcAddress,
            btcPubKey,
            feeRate,
            btcFeeRate,
            deadline,
            { value: STAKE_AMOUNT }
        );
        let receipt = await tx.wait();
        console.log("Register arbitrator result:", tx.hash)
        await btcAddressParser.connect(owner).setBtcAddressToScript(btcAddress, btcScript);

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
                dapp.address,
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
                    dapp.address,
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
                    dapp.address,
                    { value: ethers.utils.parseEther("0.1") }
                )
            ).to.be.revertedWith("T3");
        });

        it("Should success to register transaction with 0 ela fee", async function () {
            const deadline = (await time.latest()) + 2 * 24 * 60 * 60; // 2 days from now
            // Try to register with zero fee
            const tx = await transactionManager.connect(dapp).registerTransaction(
                    arbitrator.address,
                    deadline,
                    compensationReceiver.address,
                    dapp.address,
                    { value: 0 } // Zero fee
                );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "TransactionRegistered");
            const txId = event.args[0];

            const data = await transactionManager.connect(dapp).getTransactionDataById(txId);
            expect(data.arbitratorBtcFee).to.equal(546);
        });
    });

   describe("Transaction Upload utxos", function () {
        beforeEach(async function () {
            const deadline = (await time.latest()) + 2 * 24 * 60 * 60; // 2 days from now

            const registerTx = await transactionManager.connect(dapp).registerTransaction(
                arbitrator.address,
                deadline,
                compensationReceiver.address,
                dapp.address,
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
        it ("Should request arbitration successfully", async function () {
            const btcAddress = "1KY6M7H6hvEexW9QFqeTHzbZGuCXgAjxUn";
            const btcPubKey = "0x02098cf93afc2c0682e0b6d7e132f9fbeedc610dc1c0d09dbcd75db1892f975641";
            const btcScript = "0x76a914cb539f4329eeb589e83659c8304bcc6c99553a9688ac";
            await arbitratorManager.connect(arbitrator).setRevenueAddresses(arbitrator.address, btcPubKey, btcAddress);
            await btcAddressParser.connect(owner).setBtcAddressToScript(btcAddress, btcScript);

            const deadline = (await time.latest()) + 2 * 24 * 60 * 60; // 2 days from now

            const registerTx = await transactionManager.connect(dapp).registerTransaction(
                arbitrator.address,
                deadline,
                compensationReceiver.address,
                dapp.address,
                { value: ethers.utils.parseEther("0.1") }
            );

            const receipt = await registerTx.wait();
            const event = receipt.events.find(e => e.event === "TransactionRegistered");
            transactionId = event.args[0];
            console.log("Transaction ID:", transactionId);

            const utxos = [
                {
                    txHash: "0xada163a3cf919ea68882a6cdc43f5910863d4db14b47403f4b6e3cbac4199192",
                    index: 0,
                    script: "0x00200a00f7c850b180f51bbb20f59e87f00150fda6974c04059fab771f04b300e97e",
                    amount: 7922
                }
            ];
            await transactionManager.connect(dapp).uploadUTXOs(transactionId, utxos);

            const rawData = "0x02000000000101929119c4ba3c6e4b3f40474bb14d3d8610593fc4cda68288a69e91cfa363a1ad00000000000000000001a01b0000000000001976a914cb539f4329eeb589e83659c8304bcc6c99553a9688ac05483045022100f1296c9b96f1029d6b74782c9a827ee334a773e33d3a3593816543594ffd1b940220453bfa91aec7a445619cea8f3a5219945260d5ef529d6e02f399318eed96e6a901473044022007974847cf4d0397b4ca736e92e8c3ada42dc8f1c2cb2f98b0038e9967be684f0220241464a067fe1bb3ffbecb178a12004993ec0f51ea9dfc09521096f855f3f3d201010100fd0a016321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad210249d5b1a12045ff773b85033d3396faa32fd579cee25c4f7bb6aef6103228bd72ac676321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad21036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac676303ab0440b275210249d5b1a12045ff773b85033d3396faa32fd579cee25c4f7bb6aef6103228bd72ada820c7edc93e03202c56d1067d602476e3dd982689b0a6be6a44d016404926cd66ce876703b20440b27521036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac68686800000000";
            const signData = "0x020000005228f7c3672dcb443b52466b8db55c6eab19c48b20566fd9b4dffcef22aa1ea68cb9012517c817fead650287d61bdd9c68803b6bf9c64133dcab3e65b5a50cb9929119c4ba3c6e4b3f40474bb14d3d8610593fc4cda68288a69e91cfa363a1ad00000000fd0a016321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad210249d5b1a12045ff773b85033d3396faa32fd579cee25c4f7bb6aef6103228bd72ac676321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad21036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac676303ab0440b275210249d5b1a12045ff773b85033d3396faa32fd579cee25c4f7bb6aef6103228bd72ada820c7edc93e03202c56d1067d602476e3dd982689b0a6be6a44d016404926cd66ce876703b20440b27521036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac686868f21e00000000000000000000ead446471e4af625670645be820c1169499315744764fd4ab6a89d86e24593510000000001000000";
            const signHash = "0xbc671702bd4023e7088f9abf540bfdeb2648c5b35ec75335f181dca02cd36b40";
            const script = "0x6321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad210249d5b1a12045ff773b85033d3396faa32fd579cee25c4f7bb6aef6103228bd72ac676321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad21036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac676303ab0440b275210249d5b1a12045ff773b85033d3396faa32fd579cee25c4f7bb6aef6103228bd72ada820c7edc93e03202c56d1067d602476e3dd982689b0a6be6a44d016404926cd66ce876703b20440b27521036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac686868";

            let arbitrationData = {
                id: transactionId,
                rawData: rawData,
                signDataType: 1,
                signHashFlag: 1,
                script: script,
                timeoutCompensationReceiver: dapp.address
            }

            await expect(transactionManager.connect(dapp).requestArbitration(
                arbitrationData))
                .emit(transactionManager, "ArbitrationRequested");
            
            const transactionData = await transactionManager.getTransactionDataById(transactionId);
            const transactionParties = await transactionManager.getTransactionPartiesById(transactionId);
            const transactionRawData = await transactionManager.getTransactionBtcRawDataById(transactionId);
            const transactionSignHash = await transactionManager.getTransactionSignHashById(transactionId);
            expect(transactionData.status).to.equal(2);
            expect(transactionParties.arbitrator).to.equal(arbitrator.address);
            expect(transactionRawData).to.equal(rawData);
            expect(transactionSignHash).to.equal(signHash);
            expect(transactionParties.timeoutCompensationReceiver).to.equal(dapp.address);
            const txSignData = await transactionManager.transactionSignData(transactionSignHash);
            expect(txSignData).to.equal(signData);

            expect(await transactionManager.txHashToId(signHash)).to.equal(transactionId);
        });

        it ("Should request arbitration successfully 2", async function () {
            const deadline = (await time.latest()) + 2 * 24 * 60 * 60; // 2 days from now

            const registerTx = await transactionManager.connect(dapp).registerTransaction(
                arbitrator.address,
                deadline,
                compensationReceiver.address,
                dapp.address,
                { value: ethers.utils.parseEther("0.1") }
            );

            const receipt = await registerTx.wait();
            const event = receipt.events.find(e => e.event === "TransactionRegistered");
            transactionId = event.args[0];
            console.log("Transaction ID:", transactionId);

            const utxos = [
                {
                    txHash: "0x877acb3004a0e90c98489486231f04c32fd4f693386b90c044286e7c7850b6a7",
                    index: 0,
                    script: "0x76a914cb539f4329eeb589e83659c8304bcc6c99553a9688ac",
                    amount: 12361
                }
            ];
            await transactionManager.connect(dapp).uploadUTXOs(transactionId, utxos);

            const rawData = "0x02000000000101a7b650787c6e2844c0906b3893f6d42fc3041f23869448980ce9a00430cb7a870000000000000000000268210000000000001976a9149b42587007f85e456b5d0d702e828f34ea1f55b188ac640000000000000017a9146fb7f3048e4b6d3eb81ecb1760221650734bab2887050000010100fd0a0163210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac6763210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad2102098cf93afc2c0682e0b6d7e132f9fbeedc610dc1c0d09dbcd75db1892f975641ac676303b60040b275210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ada8205a0737e8cbcfa24dcc118b0ab1e6d98bee17c57daa8a1686024159aae707ed6f876703bd0040b275210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac68686800000000";
            const script = "0x6321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad210249d5b1a12045ff773b85033d3396faa32fd579cee25c4f7bb6aef6103228bd72ac676321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad21036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac676303ab0440b275210249d5b1a12045ff773b85033d3396faa32fd579cee25c4f7bb6aef6103228bd72ada820c7edc93e03202c56d1067d602476e3dd982689b0a6be6a44d016404926cd66ce876703b20440b27521036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac686868";

            let arbitrationData = {
                id: transactionId,
                rawData: rawData,
                signDataType: 1,
                signHashFlag: 1,
                script: script,
                timeoutCompensationReceiver: dapp.address
            }

            await expect(transactionManager.connect(dapp).requestArbitration(
                arbitrationData))
                .emit(transactionManager, "ArbitrationRequested");
            
            const transactionData = await transactionManager.getTransactionDataById(transactionId);
            const transactionParties = await transactionManager.getTransactionPartiesById(transactionId);
            const transactionRawData = await transactionManager.getTransactionBtcRawDataById(transactionId);
            const btcTxHash = await transactionManager.getTransactionSignHashById(transactionId);
            expect(transactionData.status).to.equal(2);
            expect(transactionParties.arbitrator).to.equal(arbitrator.address);
            expect(transactionRawData).to.equal(rawData);
            expect(transactionParties.timeoutCompensationReceiver).to.equal(dapp.address);
            expect(await transactionManager.txHashToId(btcTxHash)).to.equal(transactionId);
        });

        it ("Should request arbitration failed with invalid output amount", async function () {
            const btcAddress = "3BsjHrh35Ex52oq4d21Uvn9EJWTkSN8m6j";
            const btcPubKey = "0x02098cf93afc2c0682e0b6d7e132f9fbeedc610dc1c0d09dbcd75db1892f975641";
            const btcScript = "0xa9146fb7f3048e4b6d3eb81ecb1760221650734bab2887";
            await arbitratorManager.connect(arbitrator).setRevenueAddresses(arbitrator.address, btcPubKey, btcAddress);
            await btcAddressParser.connect(owner).setBtcAddressToScript(btcAddress, btcScript);

            const deadline = (await time.latest()) + 2 * 24 * 60 * 60; // 2 days from now

            const registerTx = await transactionManager.connect(dapp).registerTransaction(
                arbitrator.address,
                deadline,
                compensationReceiver.address,
                dapp.address,
                { value: ethers.utils.parseEther("0.1") }
            );

            const receipt = await registerTx.wait();
            const event = receipt.events.find(e => e.event === "TransactionRegistered");
            transactionId = event.args[0];
            console.log("Transaction ID:", transactionId);

            const utxos = [
                {
                    txHash: "0x877acb3004a0e90c98489486231f04c32fd4f693386b90c044286e7c7850b6a7",
                    index: 0,
                    script: "0x76a914cb539f4329eeb589e83659c8304bcc6c99553a9688ac",
                    amount: 12361
                }
            ];
            await transactionManager.connect(dapp).uploadUTXOs(transactionId, utxos);

            const rawData = "0x02000000000101a7b650787c6e2844c0906b3893f6d42fc3041f23869448980ce9a00430cb7a870000000000000000000268210000000000001976a9149b42587007f85e456b5d0d702e828f34ea1f55b188ac640000000000000017a9146fb7f3048e4b6d3eb81ecb1760221650734bab2887050000010100fd0a0163210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac6763210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad2102098cf93afc2c0682e0b6d7e132f9fbeedc610dc1c0d09dbcd75db1892f975641ac676303b60040b275210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ada8205a0737e8cbcfa24dcc118b0ab1e6d98bee17c57daa8a1686024159aae707ed6f876703bd0040b275210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac68686800000000";
            const script = "0x6321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad210249d5b1a12045ff773b85033d3396faa32fd579cee25c4f7bb6aef6103228bd72ac676321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad21036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac676303ab0440b275210249d5b1a12045ff773b85033d3396faa32fd579cee25c4f7bb6aef6103228bd72ada820c7edc93e03202c56d1067d602476e3dd982689b0a6be6a44d016404926cd66ce876703b20440b27521036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac686868";

            let arbitrationData = {
                id: transactionId,
                rawData: rawData,
                signDataType: 1,
                signHashFlag: 1,
                script: script,
                timeoutCompensationReceiver: dapp.address
            }
            await expect(transactionManager.connect(dapp).requestArbitration(arbitrationData)).to.be.revertedWith("I5");

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
                dapp.address,
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
            let transaction = await transactionManager.getTransactionDataById(transactionId);
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
