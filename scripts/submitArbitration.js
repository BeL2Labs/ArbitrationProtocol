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

    let btcRawData = "0x0200000000010105aa2e5a695fec1435ce52f078191dae34f12a3142975a95e7d37de093c89c2800000000000000000001f6290000000000001976a9149b42587007f85e456b5d0d702e828f34ea1f55b188ac050000010100fd0a0163210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad21020d983021f335423a077bc62ddcbb8f18163959333747cdb079d116ecb45bffb0ac6763210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad21024b84ffd1896c96a8f81fc874c2b5b4a2051c50b1a8dd350de8ea03bb89484672ac676303ac0040b27521020d983021f335423a077bc62ddcbb8f18163959333747cdb079d116ecb45bffb0ada8205a0737e8cbcfa24dcc118b0ab1e6d98bee17c57daa8a1686024159aae707ed6f876703ac0040b275210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac68686800000000";
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

    // const signature = `0x${derSignature.toString('hex')}`;
    let signature = "0x304402202ae9abf3dfae7c40740111475e4eb854e3f7fd44393463be543b19f6c42a2a0f02207cfbc295a3b8b6adc74f3d250620f1e00a92dc275d29a18b00bdca95742b602b01";
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
