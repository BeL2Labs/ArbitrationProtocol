const { ethers, network } = require("hardhat");
const { readConfig } = require("./helper.js");
const {sha256} = require("bitcoinjs-lib/src/crypto");
const secp256k1 = require("secp256k1");
const bitcoin = require('bitcoinjs-lib');

async function main() {
    let [deployer, operator] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log("operator address:", operator.address);

    // Get the contract factory for TransactionManager
    const TransactionManager = await ethers.getContractFactory("TransactionManager");

    // Get the transaction manager address from config
    const transactionManagerAddress = await readConfig(network.name, "TRANSACTION_MANAGER");
    console.log("Transaction Manager Address:", transactionManagerAddress);
    
    // Connect to the deployed contract
    const transactionManager = TransactionManager.attach(transactionManagerAddress).connect(operator);

    // Transaction ID for arbitration submission
    const transactionId = "0x80ae18c8a4faf3cbb7889efb4c9d30610ae25214650e1710ec44b214c381c681";
    const transaction = await transactionManager.getTransactionById(transactionId);
    const sigHash = transaction.btcTxHash;

    let privateKey = process.env.staging_key;
    if (network.name == "stage") {
        privateKey = process.env.staging_key;
    } else if (network.name == "prod") {
        privateKey = process.env.prod_key;
    }
   
    if (!privateKey) {
        throw new Error('No private key found in environment');
    }

    // Remove '0x' prefix if present
    const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    const privateKeyBuffer = Buffer.from(cleanPrivateKey, 'hex');

    let sigHashBuffer = Buffer.from(sigHash.replace('0x', ''), 'hex');

    const signatureObj = secp256k1.ecdsaSign(sigHashBuffer, privateKeyBuffer);

    const credentials = await getBitcoinCredentials(privateKey);
    const publicKey   = credentials.btcPubKey;
    let res = secp256k1.ecdsaVerify(signatureObj.signature, sigHashBuffer, Buffer.from(publicKey.replace('0x', ''), 'hex'));
    console.log("res=", res);
    if (!res) {
        throw new Error('Signature verification failed');
    }

    const signature =secp256k1.signatureExport(signatureObj.signature)
    let signatureHex = `0x${Buffer.from(signature).toString('hex')}`;

    try {
        // Log transaction details
        console.log("Transaction ID for Arbitration Submission:", transactionId);
        let gasLimit = await transactionManager.estimateGas.submitArbitration(transactionId, signatureHex);
        console.log("gasLimit:", gasLimit);
        // Call submitArbitration
        const tx = await transactionManager.submitArbitration(
            transactionId,
            signature,
            {
                gasLimit: gasLimit // Hardcoded gas limit
            }
        );

        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        // Log the transaction details
        console.log("Arbitration submitted successfully!");
        console.log("Transaction Hash:", tx.hash);
        console.log("Block Number:", receipt.blockNumber);
        
        // Check if there are any events
        if (receipt.logs && receipt.logs.length > 0) {
            console.log("Transaction Logs:", receipt.logs);
            
            // Try to parse events
            receipt.logs.forEach((log, index) => {
                try {
                    const parsedLog = transactionManager.interface.parseLog(log);
                    console.log(`Parsed Event ${index}:`, parsedLog);
                } catch (parseError) {
                    console.error(`Error parsing event ${index}:`, parseError);
                }
            });
        }
    } catch (error) {
        console.error("Error submitting arbitration:", error);
        
        // Detailed error logging
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        
        // If it's a revert error, try to decode the reason
        if (error.code === 'ACTION_REJECTED' || error.code === 'CALL_EXCEPTION') {
            try {
                const errorInterface = transactionManager.interface;
                const errorDescription = errorInterface.decodeErrorResult(error.data);
                console.error("Decoded Error:", errorDescription);
            } catch (decodeError) {
                console.error("Could not decode error:", decodeError);
            }
        }
        
        // Additional error context
        console.error("Full Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

async function getBitcoinCredentials(privateKey) {
    try {
        // Convert Ethereum private key to Buffer (remove '0x' prefix if present)
        const privKeyBuffer = Buffer.from(privateKey.replace('0x', ''), 'hex');
        const pubKey = secp256k1.publicKeyCreate(privKeyBuffer, true);
        console.log("pubKey=", pubKey);
        const pubKeyHex = "0x" +Buffer.from(pubKey).toString("hex");

        // Convert Uint8Array to Buffer
        const pubKeyBuffer = Buffer.from(pubKey);

        // Create legacy address (P2PKH)
        const { address } = bitcoin.payments.p2pkh({
            pubkey: pubKeyBuffer,
            network: bitcoin.networks.mainnet
        });

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