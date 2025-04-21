const { expect } = require("chai");
const { ethers, network, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ArbitratorManager", function () {
  let configManager;
  let arbitratorManager;
  let transactionManager;
  let compensationManager;
  let dappRegistry;
  let owner;
  let arbitrator;
  let operator;
  let dapp;
  let mockOracle;
  let mockERC20;
  let tokenWhitelist;
  let assetManager;
  
  const feeRate = 1000; // 10% annual rate
  const btcFeeRate = 1000; // 10% annual rate
  const stakeAmount = ethers.utils.parseEther("100");
  const minFeeRate = 100; // Assuming a minimum fee rate from ConfigManager
  const btcAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
  const btcPubKey = ethers.utils.arrayify("0x03f028892bad7ed57d2fb57bf33081d5cfcf6f9ed3d3d7f159c2e2fff579dc341a"); 
  const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now

  beforeEach(async function () {
    [owner, arbitrator, operator, dapp] = await ethers.getSigners();

    // Deploy ConfigManager
    const ConfigManager = await ethers.getContractFactory("ConfigManager");
    configManager = await upgrades.deployProxy(ConfigManager, [], { initializer: 'initialize' });
    // Deploy DAppRegistry
    const DAppRegistry = await ethers.getContractFactory("DAppRegistry");
    dappRegistry = await upgrades.deployProxy(DAppRegistry, [configManager.address], { initializer: 'initialize' });

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
      configManager.address
    ], { initializer: 'initialize' });

    const TokenWhitelist = await ethers.getContractFactory("TokenWhitelist");
    tokenWhitelist = await TokenWhitelist.deploy();
  
    const AssetManager = await ethers.getContractFactory("AssetManager");
    assetManager = await upgrades.deployProxy(AssetManager, [
      arbitratorManager.address,
      owner.address,  // Temporary NFT contract address
      owner.address,   // Temporary NFT info contract address
      mockOracle.address,
      tokenWhitelist.address
    ], { initializer: 'initialize' });
    await arbitratorManager.connect(owner).setAssetManager(assetManager.address);

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

    // Deploy TransactionManager
    const TransactionManager = await ethers.getContractFactory("TransactionManager");
    transactionManager = await upgrades.deployProxy(TransactionManager, [
        arbitratorManager.address,
        dappRegistry.address,
        configManager.address,
        compensationManager.address,
        btcUtils.address,
        btcAddressParser.address
    ], { initializer: 'initialize' });

    // Set TransactionManager as the transaction manager in ArbitratorManager
    await arbitratorManager.setTransactionManager(transactionManager.address);
    await arbitratorManager.setCompensationManager(compensationManager.address);

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockERC20 = await MockERC20.deploy("MockToken", "MT");

    await mockERC20.connect(owner).mint(arbitrator.address, ethers.utils.parseEther("1000"));

    // Register DApp
    await dappRegistry.connect(owner).registerDApp(dapp.address,{value: ethers.utils.parseEther("10")});
    await dappRegistry.connect(owner).authorizeDApp(dapp.address);
  });

  describe("Arbitrator Registration with ETH", function () {
    it("Should register new arbitrator with ETH stake", async function () {
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

      const arbitratorInfo = await arbitratorManager.getArbitratorOperationInfo(arbitrator.address);
      expect(arbitratorInfo.operator).to.equal(arbitrator.address);
      expect(arbitratorInfo.operatorBtcAddress).to.equal(btcAddress);
      const revenueInfo = await arbitratorManager.getArbitratorRevenueInfo(arbitrator.address);
      expect(revenueInfo.revenueETHAddress).to.equal(arbitrator.address);
      expect(revenueInfo.currentFeeRate).to.equal(feeRate);
    });

    it("Should fail to register with insufficient stake", async function () {
      const smallStake = ethers.utils.parseEther("5"); // Less than minimum stake

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

  describe("Arbitrator Registration with ERC20", function () {
    it("Should succeeded to register with stake ERC20", async function () {
      await mockERC20.connect(arbitrator).approve(assetManager.address, stakeAmount);
      await tokenWhitelist.connect(owner).addToken(mockERC20.address);
      await arbitratorManager.connect(arbitrator).registerArbitratorByStakeERC20(
        mockERC20.address,
        stakeAmount,
        btcAddress,
        btcPubKey,
        feeRate,
        btcFeeRate,
        deadline
      );

      const totalStake = await arbitratorManager.getAvailableStake(arbitrator.address);
      expect(totalStake).to.equal(stakeAmount);
      const operateInfo = await arbitratorManager.getArbitratorOperationInfo(arbitrator.address);
      expect(operateInfo.operator).to.equal(arbitrator.address);
      expect(operateInfo.operatorBtcAddress).to.equal(btcAddress);
      const revenueInfo = await arbitratorManager.getArbitratorRevenueInfo(arbitrator.address);
      expect(revenueInfo.revenueETHAddress).to.equal(arbitrator.address);
      expect(revenueInfo.currentFeeRate).to.equal(feeRate);
      expect(await mockERC20.balanceOf(arbitrator.address)).to.equal(ethers.utils.parseEther("900"));
      expect(await mockERC20.balanceOf(assetManager.address)).to.equal(stakeAmount);
    });

    it("Should failed to register with not whitelisted token", async function () {
      await mockERC20.connect(arbitrator).approve(assetManager.address, stakeAmount);
      await expect(
        arbitratorManager.connect(arbitrator).registerArbitratorByStakeERC20(
          mockERC20.address,
          stakeAmount,
          btcAddress,
          btcPubKey,
          feeRate,
          btcFeeRate,
          deadline
        )
      ).to.be.revertedWith("W0");
    });

    it("Should succeeded to register with stake ERC20 and stake more ETH", async function () {
      await mockERC20.connect(arbitrator).approve(assetManager.address, stakeAmount);
      await tokenWhitelist.connect(owner).addToken(mockERC20.address);
      await arbitratorManager.connect(arbitrator).registerArbitratorByStakeERC20(
        mockERC20.address,
        stakeAmount,
        btcAddress,
        btcPubKey,
        feeRate,
        btcFeeRate,
        deadline
      );

      await arbitratorManager.connect(arbitrator).stakeETH({value: ethers.utils.parseEther("10")});
      const totalStake = await arbitratorManager.getAvailableStake(arbitrator.address);
      expect(totalStake).to.equal(stakeAmount.add(ethers.utils.parseEther("10")));

      const stakeAsset = await arbitratorManager.getArbitratorAssets(arbitrator.address);
      expect(stakeAsset.ethAmount).to.equal(ethers.utils.parseEther("10"));
      expect(stakeAsset.nftTokenIds).to.be.an('array').that.is.empty;
      expect(stakeAsset.erc20Token).to.equal(mockERC20.address);
      expect(stakeAsset.erc20Amount).to.equal(stakeAmount);
    });
  });

  describe("Stake Management", function () {
    const stakeAmount = ethers.utils.parseEther("10");
    const feeRate = 100; // 1%
    const btcFeeRate = 100; // 1%

    beforeEach(async function () {
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

    it("Should allow unstaking and restaking ETH", async function () {
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

    it("Should get arbitrator info", async function () {
      const stakeAsset = await arbitratorManager.getArbitratorAssets(arbitrator.address);
      // Validate specific fields
      expect(stakeAsset.ethAmount).to.equal(stakeAmount);

      const operateInfo = await arbitratorManager.getArbitratorOperationInfo(arbitrator.address);
      expect(operateInfo.operator).to.equal(arbitrator.address);
      expect(operateInfo.operatorBtcAddress).to.equal(btcAddress);

      const basicInfo = await arbitratorManager.getArbitratorBasicInfo(arbitrator.address);
      expect(basicInfo.deadline).to.equal(deadline);

      const revenueInfo = await arbitratorManager.getArbitratorRevenueInfo(arbitrator.address);
      expect(revenueInfo.currentFeeRate).to.equal(feeRate);
      expect(revenueInfo.currentBTCFeeRate).to.equal(btcFeeRate);

      // Convert both to hex strings for comparison
      const storedPubKeyHex = ethers.utils.hexlify(operateInfo.operatorBtcPubKey);
      const inputPubKeyHex = ethers.utils.hexlify(btcPubKey);
      expect(storedPubKeyHex).to.equal(inputPubKeyHex);

      expect(stakeAsset.nftTokenIds).to.be.an('array').that.is.empty;
    });
  });

  describe("Arbitrator unstake", function () {
    beforeEach(async function () {
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
  
    it("Should unstake successfully", async function () {
      const tx = await arbitratorManager.connect(arbitrator).unstake();
      await tx.wait();

      const stakeAsset = await arbitratorManager.getArbitratorAssets(arbitrator.address);
      expect(stakeAsset.ethAmount).to.equal(0);
      expect(stakeAsset.nftTokenIds).to.be.an('array').that.is.empty;
    });

    it("Should unstake multi stakes successfully", async function () {
      await mockERC20.connect(arbitrator).approve(assetManager.address, stakeAmount);
      await tokenWhitelist.connect(owner).addToken(mockERC20.address);
      await arbitratorManager.connect(arbitrator).stakeERC20(mockERC20.address, stakeAmount);
      expect(await ethers.provider.getBalance(assetManager.address)).to.equal(stakeAmount);
      expect(await mockERC20.balanceOf(assetManager.address)).to.equal(stakeAmount);

      const tx = await arbitratorManager.connect(arbitrator).unstake();
      await tx.wait();

      expect(await ethers.provider.getBalance(assetManager.address)).to.equal(0);
      expect(await mockERC20.balanceOf(assetManager.address)).to.equal(0);
      expect(await mockERC20.balanceOf(arbitrator.address)).to.equal(ethers.utils.parseEther("1000"));
    
      const stakeAsset = await arbitratorManager.getArbitratorAssets(arbitrator.address);
      expect(stakeAsset.ethAmount).to.equal(0);
      expect(stakeAsset.nftTokenIds).to.be.an('array').that.is.empty;
      expect(stakeAsset.erc20Token).to.equal(ethers.constants.AddressZero);
      expect(stakeAsset.erc20Amount).to.equal(0);
    });

    it("Should unstake failed with stake locked", async function () {
      const deadline = (await time.latest()) + 2 * 24 * 60 * 60; // 2 days from now
      const regdata = {
          arbitrator: arbitrator.address,
          deadline: deadline,
          compensationReceiver: owner.address,
          refundAddress: dapp.address,
      }
      await transactionManager.connect(dapp).registerTransaction(
          regdata,
          { value: ethers.utils.parseEther("0.1") }
      );

      await expect(arbitratorManager.connect(arbitrator).unstake()).to.be.revertedWith("S1");
    });
  });

  describe("Fee Calculations", function () {
    const secondsPerYear = 365 * 24 * 60 * 60;
    const feeRate = 1000; // 1%
    const btcFeeRate = 100; // 1%

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
