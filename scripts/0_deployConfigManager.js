const { ethers, network, upgrades, getChainId } = require("hardhat");
const { sleep, writeConfig } = require("./helper.js");

async function verifyInitialConfig(contract) {
    console.log("Verifying initial configuration...");
    
    // Use ethers.keccak256 to compute the same constant values as in the contract
    const MIN_STAKE = ethers.keccak256(ethers.toUtf8Bytes("MIN_STAKE"));
    const MAX_STAKE = ethers.keccak256(ethers.toUtf8Bytes("MAX_STAKE"));
    const MIN_STAKE_LOCKED_TIME = ethers.keccak256(ethers.toUtf8Bytes("MIN_STAKE_LOCKED_TIME"));
    const SYSTEM_FEE_RATE = ethers.keccak256(ethers.toUtf8Bytes("systemFeeRate"));
    
    const minStake = await contract.getConfig(MIN_STAKE);
    console.log("MIN_STAKE:", ethers.formatEther(minStake), "ETH");
    
    const maxStake = await contract.getConfig(MAX_STAKE);
    console.log("MAX_STAKE:", ethers.formatEther(maxStake), "ETH");
    
    const minStakeLockedTime = await contract.getConfig(MIN_STAKE_LOCKED_TIME);
    console.log("MIN_STAKE_LOCKED_TIME:", minStakeLockedTime.toString(), "seconds");
    
    const systemFeeRate = await contract.getConfig(SYSTEM_FEE_RATE);
    console.log("SYSTEM_FEE_RATE:", systemFeeRate.toString(), "basis points");
}

async function main() {
    try {
        console.log("Starting deployment...");
        const chainID = await getChainId();
        console.log("Deploying to chain ID:", chainID);
        
        const [deployer] = await ethers.getSigners();
        console.log("Deploying contracts with account:", deployer.address);
        console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

        // Get contract factory
        const ConfigManager = await ethers.getContractFactory("ConfigManager", deployer);

        // Deploy proxy using upgrades plugin
        console.log("\nDeploying proxy...");
        const proxy = await upgrades.deployProxy(ConfigManager, [], {
            initializer: 'initialize',
            timeout: 60000,
            pollingInterval: 5000,
            txOverrides: {
                gasLimit: 3000000,
                gasPrice: 1000000000 // 1 gwei
            }
        });

        await proxy.waitForDeployment();
        const proxyAddress = await proxy.getAddress();
        console.log("Proxy deployed to:", proxyAddress);

        // Get implementation address
        let implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
        console.log("Implementation deployed to:", implAddress);

        // Verify initial configuration
        console.log("\nVerifying configuration...");
        await verifyInitialConfig(proxy);
        
        // Save deployment info
        console.log("\nSaving deployment info...");

        await writeConfig(network.name, "CONFIG_MANAGER", proxyAddress);
        
        console.log("\nDeployment completed successfully!");
        
    } catch (error) {
        console.error("\nDeployment failed!");
        console.error(error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
