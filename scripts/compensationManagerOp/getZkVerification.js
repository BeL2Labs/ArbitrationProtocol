import { readConfig } from "../helper.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import hre from 'hardhat';
import { ethers } from 'ethers';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getZkVerification(zkServiceAddress, verificationId) {
    // Connect to the Ethereum network (replace with your preferred provider)
    const networkConfig = hre.config.networks[hre.network.name];
    const provider = new ethers.providers.JsonRpcProvider(networkConfig.url);

    // Read the ABI from the compiled artifacts
    const artifactsPath = path.join(__dirname, '../artifacts/contracts/interfaces/IZkService.sol/IZkService.json');
    const artifactsJson = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'));
    const abi = artifactsJson.abi;

    // Create a contract instance
    const zkServiceContract = new ethers.Contract(zkServiceAddress, abi, provider);
    console.log("verificationId", verificationId);
    try {
        // Call the getZkVerification method
        const verification = await zkServiceContract.getZkVerification(verificationId);
        console.log('verification:', verification);
        console.log('ZK Verification Details:');
        console.log('Status:', verification.status);
        console.log('Public Key:', verification.pubKey);
        console.log('Transaction Hash:', verification.txHash);
        console.log('Signature:', verification.signature);
        console.log('Verification Status:', verification.verified);
        console.log('UTXOs:', verification.utxos);

        return verification;
    } catch (error) {
        console.error('Error fetching ZK verification:', error);
        throw error;
    }
}

// Get ZK Service Address and run verification
const ZK_SERVICE_ADDRESS = await readConfig(hre.network.name, "ZK_SERVICE");
const VERIFICATION_ID = "0xdc6fbb7cd98380d697ffab947bcd9ad8fd009a1e7be33eb7640af5b6053f019e";

getZkVerification(ZK_SERVICE_ADDRESS, VERIFICATION_ID)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

export { getZkVerification };