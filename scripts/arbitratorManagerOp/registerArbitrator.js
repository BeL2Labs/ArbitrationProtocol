const { ethers,network } = require("hardhat");
const { readConfig, writeConfig } = require("../helper.js");
const bitcoin = require('bitcoinjs-lib');
const {publicKeyCreate} = require("secp256k1");

async function getBitcoinCredentials(privateKey) {
    try {
      // Convert Ethereum private key to Buffer (remove '0x' prefix if present)
      const privKeyBuffer = Buffer.from(privateKey.replace('0x', ''), 'hex');
  
      const pubKey = publicKeyCreate(privKeyBuffer, true);
  
      // Create legacy address (P2PKH)
      const { address } = bitcoin.payments.p2pkh({ 
        pubkey: pubKey,
        network: bitcoin.networks.mainnet 
      });
      
      // Convert public key to hex string with 0x prefix
      const pubKeyHex = Buffer.from(pubKey).toString("hex");
      
      console.log("Generated Bitcoin credentials:");
      console.log("Public Key Buffer:", pubKey);
      console.log("Public Key Hex:", pubKeyHex);
      console.log("Bitcoin Address:", address);
      
      return {
        btcPubKey: pubKeyHex,
        btcAddress: address
      };
    } catch (error) {
      console.error('Error in getBitcoinCredentials:', error);
      throw error;
    }
  }
async function main() {
    // Get the signer (first account)
    const [, operator] = await ethers.getSigners();
    console.log("Registering arbitrator with address:", operator.address);

    // Read ArbitratorManager address from config
    const arbitratorManagerAddress = await readConfig(network.name, "ARBITRATOR_MANAGER");
    
    // Get contract factories
    const ArbitratorManagerFactory = await ethers.getContractFactory("ArbitratorManager");
    const ConfigManagerFactory = await ethers.getContractFactory("ConfigManager");

    // Create contract instances
    const arbitratorManager = ArbitratorManagerFactory.attach(arbitratorManagerAddress).connect(operator);
    const configManagerAddress = await arbitratorManager.configManager();////ConfigManagerFactory.attach(configManagerAddress).connect(operator);
    console.log("configManager=", configManagerAddress);
    const configManager = ConfigManagerFactory.attach(configManagerAddress).connect(operator);
    // Get minimum stake requirement
    const minStake = await configManager.getConfig(await configManager.MIN_STAKE());
    console.log("Minimum Stake Requirement:", ethers.utils.formatEther(minStake), "ETH");

    const TRANSACTION_MIN_BTC_FEE_RATE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TRANSACTION_MIN_BTC_FEE_RATE"))
    const minBtc_feeRate = await configManager.getConfig(TRANSACTION_MIN_BTC_FEE_RATE);
    console.log("minBtc_feeRate:", minBtc_feeRate, "satoshi");

    const min_fee_rate = await configManager.getConfig(await configManager.TRANSACTION_MIN_FEE_RATE());
    console.log("min_fee_rate:", min_fee_rate);

    let arbitrator_index = 1;
    const accounts = network.config.accounts;
    let privateKey;
    if (typeof accounts === 'string') {
        // If using mnemonic
        const wallet = ethers.Wallet.fromMnemonic(accounts);
        privateKey = wallet.privateKey;
    } else if (Array.isArray(accounts)) {
        // If using private keys array
        privateKey = accounts[arbitrator_index];
    } else {
        throw new Error("Could not get private key from network config");
    }

    // Prepare arbitrator registration parameters
    let { btcPubKey, btcAddress } = await getBitcoinCredentials(privateKey);
    const feeRate = min_fee_rate; // 0.1% fee rate (4 decimal places)
    const btcFeeRate = ethers.utils.parseUnits("0.1", 4); // 0.1% fee rate (4 decimal places)
    const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now
    btcPubKey = "0x" + btcPubKey;
    try {
        // Estimate gas for the transaction
        const gasEstimate = await arbitratorManager.estimateGas.registerArbitratorByStakeETH(
            btcAddress, btcPubKey, feeRate, btcFeeRate, deadline,
            {
                 value: minStake
            });
        console.log("Estimated Gas:", gasEstimate.toString());
        // Send transaction to register arbitrator
        const tx = await arbitratorManager.registerArbitratorByStakeETH(
            btcAddress, btcPubKey, feeRate, btcFeeRate, deadline,
            {
                value: minStake,
                gasLimit: gasEstimate // Add some buffer
            });

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log("Arbitrator Registration Transaction Hash:", receipt.transactionHash);
        console.log("Next Step, you should call setOperator use set_operator.js");

    } catch (error) {
        console.error("Error registering arbitrator:", error);
        
        // Detailed error logging
        if (error.reason) console.error("Reason:", error.reason);
        if (error.code) console.error("Error Code:", error.code);
        if (error.method) console.error("Method:", error.method);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    });
