const { ethers, network, getChainId } = require("hardhat");
const { readConfig } = require("./helper.js");
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
  const chainID = await getChainId();
  console.log("chain ID:", chainID);
  let operator_index = 1;
  const [owner, operator] = await ethers.getSigners();
  
  // Get private key from hardhat config
  const accounts = network.config.accounts;
  let privateKey;
  if (typeof accounts === 'string') {
    // If using mnemonic
    const wallet = ethers.Wallet.fromMnemonic(accounts);
    privateKey = wallet.privateKey;
  } else if (Array.isArray(accounts)) {
    // If using private keys array
    privateKey = accounts[operator_index];
  } else {
    throw new Error("Could not get private key from network config");
  }
 
  console.log("operator address:", operator.address);
  const { btcPubKey, btcAddress } = await getBitcoinCredentials(privateKey);
  
  // Get the contract factory
  const ArbitratorManager = await ethers.getContractFactory("ArbitratorManager");
  
  // Get the deployed contract address from config
  const arbitratorManagerAddress = await readConfig(network.name, "ARBITRATOR_MANAGER");
  console.log("arbitratorManagerAddress:", arbitratorManagerAddress);
  
  // Get the contract instance
  const arbitratorManager = await ArbitratorManager.attach(arbitratorManagerAddress).connect(owner);

  // Parameters for setOperator
  const operatorAddress = operator.address;

  console.log("Setting operator with:");
  console.log("Operator Address:", operatorAddress);
  console.log("BTC Public Key:", btcPubKey);
  console.log("BTC Address:", btcAddress);

  let gasLimit = await arbitratorManager.estimateGas.setOperator(operatorAddress, "0x" + btcPubKey, btcAddress);
  // Call setOperator
  const tx = await arbitratorManager.setOperator(
    operatorAddress,
    "0x" + btcPubKey,
    btcAddress,
    {
      gasLimit: gasLimit
    }
  );
  
  // Wait for the transaction to be mined
  await tx.wait();
  
  console.log("Successfully set operator!");
  console.log("Transaction hash:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
