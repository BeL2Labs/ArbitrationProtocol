const { ethers, network } = require("hardhat");
const { readConfig } = require("./helper.js");
const {sha256} = require("bitcoinjs-lib/src/crypto");
const secp256k1 = require("secp256k1");
const bitcoin = require('bitcoinjs-lib');

async function main() {
    let [deployer, operator] = await ethers.getSigners();
    operator = deployer;
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
    const transactionId = "0xa0978ec76b6d7995e85d11ec2ed557b645dcd9d3ebde9ddd7218487a14a3adbb";

    let btcRawData = "0x02000000000101d0a974b9186943c73fb4445e76dd948d562abcebf896472e1745e405a502e6fd00000000000000000001132b0000000000001976a914cb539f4329eeb589e83659c8304bcc6c99553a9688ac050000010100fd0a016321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad2102e4059d0a57813a1974ddfd8555d3b5fe89717dfa76651a32604065eab3a47e94ac676321036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ad21036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac676303ab0440b2752102e4059d0a57813a1974ddfd8555d3b5fe89717dfa76651a32604065eab3a47e94ada8205a0737e8cbcfa24dcc118b0ab1e6d98bee17c57daa8a1686024159aae707ed6f876703b20440b27521036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ac68686800000000";
    if (btcRawData.length == 0) {
        console.log("getArbitrationBtcNoWitnessTx is empty");
        return;
    }
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

    // Sign the raw transaction using secp256k1
    const messageHash = sha256(Buffer.from(btcRawData.replace('0x', ''), 'hex')); // In Bitcoin, the entire transaction is hashed
    const signatureObj = secp256k1.ecdsaSign(messageHash, privateKeyBuffer);
    
    // Convert signature to DER format
    const derSignature = Buffer.concat([
        Buffer.from([signatureObj.signature.length]),
        signatureObj.signature,
        Buffer.from([bitcoin.Transaction.SIGHASH_ALL])
    ]);

    const signature = `0x${derSignature.toString('hex')}`;

    console.log(' Signature:', signature);


    try {
        // Log transaction details
        console.log("Transaction ID for Arbitration Submission:", transactionId);
        console.log("Signature:", signature);
        let gasLimit = await transactionManager.estimateGas.submitArbitration(transactionId, signature);
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
