const { expect } = require("chai");
const { ethers, network, upgrades } = require("hardhat");

describe("ArbitratorManager", function () {
  let configManager;
  let arbitratorManager;
  let owner;
  let arbitrator;
  let operator;
  let other;
  
  const feeRate = 1000; // 10% annual rate
  const btcFeeRate = 1000; // 10% annual rate
  const stakeAmount = ethers.utils.parseEther("100");
  const minFeeRate = 100; // Assuming a minimum fee rate from ConfigManager

  beforeEach(async function () {
    [owner, arbitrator, operator, other] = await ethers.getSigners();

    // Deploy ConfigManager
    const ConfigManager = await ethers.getContractFactory("ConfigManager");
    configManager = await upgrades.deployProxy(ConfigManager, [], { initializer: 'initialize' });

    // Set minimum fee rate in ConfigManager
    const minStakeKey = await configManager.callStatic.MIN_STAKE();
    const maxStakeKey = await configManager.callStatic.MAX_STAKE();
    const minFeeRateKey = await configManager.callStatic.TRANSACTION_MIN_FEE_RATE();

    await configManager.connect(owner).setConfigs(
      [minFeeRateKey, minStakeKey, maxStakeKey],
      [minFeeRate, ethers.utils.parseEther("10"), ethers.utils.parseEther("1000")]
    );
    // Deploy MockAssetOracle
    const MockOracle = await ethers.getContractFactory("MockAssetOracle");
    const mockOracle = await MockOracle.deploy();
    // Deploy ArbitratorManager
    const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager");
    arbitratorManager = await upgrades.deployProxy(ArbitratorManager, [
      configManager.address,
      owner.address,  // Temporary NFT contract address
      owner.address,   // Temporary NFT info contract address
      mockOracle.address
    ], { initializer: 'initialize' });
  });

  describe("Arbitrator Registration", function () {
    it("Should register new arbitrator with ETH stake", async function () {
      const btcAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
      const btcPubKey = ethers.utils.arrayify("0x03f028892bad7ed57d2fb57bf33081d5cfcf6f9ed3d3d7f159c2e2fff579dc341a");
      const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now

      await expect(
        arbitratorManager.connect(arbitrator).registerArbitratorByStakeETH(
          btcAddress,
          btcPubKey,
          feeRate,
          btcFeeRate,
          deadline,
          { value: stakeAmount }
        )
      ).to.emit(arbitratorManager, "ArbitratorRegistered");

      const arbitratorInfo = await arbitratorManager.getArbitratorInfo(arbitrator.address);
      expect(arbitratorInfo.operator).to.equal(arbitrator.address);
      expect(arbitratorInfo.revenueETHAddress).to.equal(arbitrator.address);
      expect(arbitratorInfo.operatorBtcAddress).to.equal(btcAddress);
      expect(arbitratorInfo.currentFeeRate).to.equal(feeRate);
    });

    it("Should fail to register with insufficient stake", async function () {
         const smallStake = ethers.utils.parseEther("5"); // Less than minimum stake
         const btcAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
         const btcPubKey = ethers.utils.arrayify("0x03f028892bad7ed57d2fb57bf33081d5cfcf6f9ed3d3d7f159c2e2fff579dc341a");
         const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now

         await expect(
           arbitratorManager.connect(arbitrator).registerArbitratorByStakeETH(
             btcAddress,
             btcPubKey,
             feeRate,
             btcFeeRate,
             deadline,
             { value: smallStake }
           )
         ).to.be.revertedWith("S2");
       });

       it("Should fail to register with invalid fee rate", async function () {
         const lowFeeRate = 50; // Below minimum fee rate
         const btcFeeRate = 50; // Below minimum fee rate
         const btcAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
         const btcPubKey = ethers.utils.arrayify("0x03f028892bad7ed57d2fb57bf33081d5cfcf6f9ed3d3d7f159c2e2fff579dc341a");
         const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now

         await expect(
           arbitratorManager.connect(arbitrator).registerArbitratorByStakeETH(
             btcAddress,
             btcPubKey,
             lowFeeRate,
             btcFeeRate,
             deadline,
             { value: stakeAmount }
           )
         ).to.be.revertedWith("F0");
       });

       it("Should fail to register with invalid deadline", async function () {
         const pastDeadline = Math.floor(Date.now() / 1000) - 24 * 60 * 60; // 1 day ago
         const btcAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
         const btcPubKey = ethers.utils.arrayify("0x03f028892bad7ed57d2fb57bf33081d5cfcf6f9ed3d3d7f159c2e2fff579dc341a");

         await expect(
           arbitratorManager.connect(arbitrator).registerArbitratorByStakeETH(
             btcAddress,
             btcPubKey,
             feeRate,
             btcFeeRate,
             pastDeadline,
             { value: stakeAmount }
           )
         ).to.be.revertedWith("T3");
       });
     });

     describe("Stake Management", function () {
       let deadline;
       const stakeAmount = ethers.utils.parseEther("10");
       const feeRate = 100; // 1%
       const btcFeeRate = 100; // 1%
       const btcAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
       const btcPubKey = ethers.utils.arrayify("0x03f028892bad7ed57d2fb57bf33081d5cfcf6f9ed3d3d7f159c2e2fff579dc341a");

       beforeEach(async function () {
         // Set a fixed deadline in the future
         deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now

         // Register arbitrator
         await arbitratorManager.connect(arbitrator).registerArbitratorByStakeETH(
           btcAddress,
           btcPubKey,
           feeRate,
           btcFeeRate,
           deadline,
           { value: stakeAmount }
         );
       });

       it("Should get available stake", async function () {
         const availableStake = await arbitratorManager.getAvailableStake(arbitrator.address);
         expect(availableStake).to.equal(stakeAmount);
       });


       it("arbitrator unstake", async function () {
        let tx = await arbitratorManager.connect(arbitrator).unstake();
        tx.wait();

        const arbitratorInfo = await arbitratorManager.getArbitratorInfo(arbitrator.address);
        expect(arbitratorInfo.ethAmount).to.equal(0);
        expect(arbitratorInfo.nftTokenIds).to.be.an('array').that.is.empty;
      });


       it("Should get arbitrator info", async function () {
         const arbitratorInfo = await arbitratorManager.getArbitratorInfo(arbitrator.address);

         // Validate specific fields
         expect(arbitratorInfo.ethAmount).to.equal(stakeAmount);
         expect(arbitratorInfo.operator).to.equal(arbitrator.address);
         expect(arbitratorInfo.currentFeeRate).to.equal(feeRate);
         expect(arbitratorInfo.deadLine).to.equal(deadline);
         expect(arbitratorInfo.operatorBtcAddress).to.equal(btcAddress);

         // Convert both to hex strings for comparison
         const storedPubKeyHex = ethers.utils.hexlify(arbitratorInfo.operatorBtcPubKey);
         const inputPubKeyHex = ethers.utils.hexlify(btcPubKey);
         expect(storedPubKeyHex).to.equal(inputPubKeyHex);

         expect(arbitratorInfo.nftTokenIds).to.be.an('array').that.is.empty;

         const arbitratorInfoExt = await arbitratorManager.getArbitratorInfoExt(arbitrator.address);
         expect(arbitratorInfoExt.currentBTCFeeRate).to.equal(btcFeeRate);
       });
     });

     describe("Stake Management", function () {
       it("Should allow unstaking and restaking ETH", async function () {
         const btcAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
         const btcPubKey = ethers.utils.arrayify("0x03f028892bad7ed57d2fb57bf33081d5cfcf6f9ed3d3d7f159c2e2fff579dc341a");
         const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now
         const feeRate = 100; // 1%
         const btcFeeRate = 100; // 1%
         // Register arbitrator with initial stake
         await arbitratorManager.connect(arbitrator).registerArbitratorByStakeETH(
           btcAddress,
           btcPubKey,
           feeRate,
           btcFeeRate,
           deadline,
           { value: stakeAmount }
         );
         let isActive = await arbitratorManager.isActiveArbitrator(arbitrator.address);
         expect(isActive).to.equal(true);

         // Check initial stake
         let availableStake = await arbitratorManager.getAvailableStake(arbitrator.address);
         expect(availableStake).to.equal(stakeAmount);

         // Unstake all ETH
         await arbitratorManager.connect(arbitrator).unstake();
         isActive = await arbitratorManager.isActiveArbitrator(arbitrator.address);
         expect(isActive).to.equal(false);

         // Check stake after unstaking
         availableStake = await arbitratorManager.getAvailableStake(arbitrator.address);
         expect(availableStake).to.equal(0);

         // Restake the same amount of ETH
         await arbitratorManager.connect(arbitrator).stakeETH({ value: stakeAmount });

         isActive = await arbitratorManager.isActiveArbitrator(arbitrator.address);
         expect(isActive).to.equal(true);

         // Check stake after restaking
         availableStake = await arbitratorManager.getAvailableStake(arbitrator.address);
         expect(availableStake).to.equal(stakeAmount);
       });
     });

    describe("Fee Calculations", function () {
      const secondsPerYear = 365 * 24 * 60 * 60;
      const feeRate = 1000; // 1%
      const btcFeeRate = 100; // 1%
      const btcAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
      const btcPubKey = ethers.utils.arrayify("0x03f028892bad7ed57d2fb57bf33081d5cfcf6f9ed3d3d7f159c2e2fff579dc341a");

      beforeEach(async function () {
        // Set a fixed deadline in the future
        const deadline = Math.floor(Date.now() / 1000) + 300 * 24 * 60 * 60; // 300 days from now

        // Register arbitrator
        await arbitratorManager.connect(arbitrator).registerArbitratorByStakeETH(
          btcAddress,
          btcPubKey,
          feeRate,
          btcFeeRate,
          deadline,
          { value: stakeAmount }
        );
      });
      
      it("Should calculate ETH fee correctly", async function () {
        const duration = 30 * 24 * 60 * 60; // 30 days
        const expectedFee = stakeAmount.mul(duration).mul(feeRate).div(secondsPerYear).div(10000);

        // Check fee
        const fee = await arbitratorManager.getFee(duration, arbitrator.address);
        expect(fee).to.equal(expectedFee);
      });

      it("Should calculate BTC fee correctly", async function () {
        // at least 1000 satoshi
        const expectedFee = 1000;
        const duration = 30 * 24 * 60 * 60; // 30 days

        const fee = await arbitratorManager.getBtcFee(duration, arbitrator.address);
        expect(fee).to.equal(expectedFee);
      });
    });
});
