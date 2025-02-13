const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("DAppRegistry", function () {
  let dappRegistry;
  let configManager;
  let owner;
  let dappOwner;
  let otherAccount;
  let dappContractAddress;
  let feeCollectorAddress;

  const REGISTRATION_FEE = ethers.utils.parseEther("10"); // 10 ETH

  beforeEach(async function () {
    console.log("Fetching signers...");
    const signers = await ethers.getSigners();
    console.log("Total signers:", signers.length);

    // Assign first three signers to standard roles
    owner = signers[0];
    dappOwner = signers[1];
    otherAccount = signers[2];

    // Create mock addresses using ethers.utils.keccak256 to generate unique addresses
    dappContractAddress = owner.address;
    feeCollectorAddress = owner.address;

    console.log("Owner address:", owner.address);
    console.log("DApp Owner address:", dappOwner.address);
    console.log("Other Account address:", otherAccount.address);
    console.log("DApp Contract address:", dappContractAddress);
    console.log("Fee Collector address:", feeCollectorAddress);

    // Deploy ConfigManager first
    const ConfigManager = await ethers.getContractFactory("ConfigManager");
    configManager = await upgrades.deployProxy(ConfigManager, [], { initializer: 'initialize' });

    // Set fee collector in ConfigManager
    await configManager.connect(owner).setSystemFeeCollector(feeCollectorAddress);

    // Deploy DAppRegistry with ConfigManager
    const DAppRegistry = await ethers.getContractFactory("DAppRegistry");
    dappRegistry = await upgrades.deployProxy(DAppRegistry, [configManager.address], { initializer: 'initialize' });
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await dappRegistry.owner()).to.equal(owner.address);
    });

    it("Should set the correct registration fee", async function () {
      expect(await dappRegistry.REGISTRATION_FEE()).to.equal(REGISTRATION_FEE);
    });

    it("Should set the correct config manager", async function () {
      expect(await dappRegistry.configManager()).to.equal(configManager.address);
    });
  });

  describe("DApp Registration", function () {
    it("Should register a new DApp with correct fee", async function () {
      const initialFeeCollectorBalance = await ethers.provider.getBalance(feeCollectorAddress);

      await expect(dappRegistry.connect(dappOwner).registerDApp(dappContractAddress, { value: REGISTRATION_FEE }))
        .to.emit(dappRegistry, "DAppRegistered")
        .withArgs(dappContractAddress, dappOwner.address);

      // Check registration status (Pending is 1)
      expect(await dappRegistry.isRegistered(dappContractAddress)).to.be.true;
      expect(await dappRegistry.getDAppOwner(dappContractAddress)).to.equal(dappOwner.address);
      expect(await dappRegistry.getDAppStatus(dappContractAddress)).to.equal(1); // Pending status

      // Verify fee transfer
      const finalFeeCollectorBalance = await ethers.provider.getBalance(feeCollectorAddress);
      expect(finalFeeCollectorBalance.sub(initialFeeCollectorBalance)).to.equal(REGISTRATION_FEE);
    });

    it("Should fail to register with insufficient fee", async function () {
      const insufficientFee = REGISTRATION_FEE.sub(ethers.utils.parseEther("1"));
      await expect(
        dappRegistry.connect(dappOwner).registerDApp(dappContractAddress, { value: insufficientFee })
      ).to.be.revertedWith("T5");
    });

    it("Should fail to register zero address", async function () {
      await expect(
        dappRegistry.connect(dappOwner).registerDApp(ethers.constants.AddressZero, { value: REGISTRATION_FEE })
      ).to.be.revertedWith("Z0");
    });
  });

  describe("DApp Authorization", function () {
    beforeEach(async function () {
      await dappRegistry.connect(dappOwner).registerDApp(dappContractAddress, { value: REGISTRATION_FEE });
    });

    it("Should authorize registered DApp", async function () {
      await expect(dappRegistry.connect(owner).authorizeDApp(dappContractAddress))
        .to.emit(dappRegistry, "DAppAuthorized")
        .withArgs(dappContractAddress);

      // Check status (Active is 2)
      expect(await dappRegistry.getDAppStatus(dappContractAddress)).to.equal(2); // Active status
    });

    it("Should fail to authorize unregistered DApp", async function () {
      const unregisteredDApp = otherAccount.address;
      await expect(
        dappRegistry.connect(owner).authorizeDApp(unregisteredDApp)
      ).to.be.revertedWith("D1");
    });

  it("Should fail if non-owner tries to authorize", async function () {
      await expect(
        dappRegistry.connect(otherAccount).authorizeDApp(dappContractAddress)
      ).to.be.reverted;
    });
  });

  describe("DApp Deregistration", function () {
    beforeEach(async function () {
      await dappRegistry.connect(dappOwner).registerDApp(dappContractAddress, { value: REGISTRATION_FEE });
    });

     it("Should allow DApp owner to deregister", async function () {
      await expect(dappRegistry.connect(dappOwner).deregisterDApp(dappContractAddress))
        .to.emit(dappRegistry, "DAppDeregistered")
        .withArgs(dappContractAddress);

      // Check status (Terminated is 4)
      expect(await dappRegistry.getDAppStatus(dappContractAddress)).to.equal(4); // Terminated status
    });

  it("Should allow owner to deregister", async function () {
      await expect(dappRegistry.connect(owner).deregisterDApp(dappContractAddress))
        .to.emit(dappRegistry, "DAppDeregistered")
        .withArgs(dappContractAddress);

      // Check status (Terminated is 4)
      expect(await dappRegistry.getDAppStatus(dappContractAddress)).to.equal(4); // Terminated status
    });

     it("Should fail to deregister unregistered DApp", async function () {
      const unregisteredDApp = otherAccount.address;
      await expect(
        dappRegistry.connect(dappOwner).deregisterDApp(unregisteredDApp)
      ).to.be.revertedWith("D1");
    });

    it("Should fail if unauthorized account tries to deregister", async function () {
      await expect(
        dappRegistry.connect(otherAccount).deregisterDApp(dappContractAddress)
      ).to.be.revertedWith("N0");
    });
  });

  describe("DApp Status Queries", function () {
    beforeEach(async function () {
      await dappRegistry.connect(dappOwner).registerDApp(dappContractAddress, { value: REGISTRATION_FEE });
    });

    it("Should return correct registration status", async function () {
      expect(await dappRegistry.isRegistered(dappContractAddress)).to.be.true;
      expect(await dappRegistry.isRegistered(otherAccount.address)).to.be.false;
    });

    it("Should return correct DApp owner", async function () {
      expect(await dappRegistry.getDAppOwner(dappContractAddress)).to.equal(dappOwner.address);
    });

    it("Should return correct DApp status throughout lifecycle", async function () {
      // Initial status after registration
      expect(await dappRegistry.getDAppStatus(dappContractAddress)).to.equal(1); // Pending

      // Status after authorization
      await dappRegistry.connect(owner).authorizeDApp(dappContractAddress);
      expect(await dappRegistry.getDAppStatus(dappContractAddress)).to.equal(2); // Active

      // Status after deregistration
      await dappRegistry.connect(dappOwner).deregisterDApp(dappContractAddress);
      expect(await dappRegistry.getDAppStatus(dappContractAddress)).to.equal(4); // Terminated
    });
  });

  describe("Config Manager Update", function () {
    it("Should allow owner to update config manager", async function () {
      const NewConfigManager = await ethers.getContractFactory("ConfigManager");
      const newConfigManager = await upgrades.deployProxy(NewConfigManager, [], { initializer: 'initialize' });

      await expect(dappRegistry.connect(owner).setConfigManager(newConfigManager.address))
        .to.emit(dappRegistry, "ConfigManagerUpdated")
        .withArgs(configManager.address, newConfigManager.address);

      expect(await dappRegistry.configManager()).to.equal(newConfigManager.address);
    });

    it("Should fail to update config manager with zero address", async function () {
      await expect(
        dappRegistry.connect(owner).setConfigManager(ethers.constants.AddressZero)
      ).to.be.revertedWith("Z0");
    });

    it("Should fail if non-owner tries to update config manager", async function () {
      const NewConfigManager = await ethers.getContractFactory("ConfigManager");
      const newConfigManager = await upgrades.deployProxy(NewConfigManager, [], { initializer: 'initialize' });

      await expect(
        dappRegistry.connect(otherAccount).setConfigManager(newConfigManager.address)
      ).to.be.reverted
    });
  });
});
