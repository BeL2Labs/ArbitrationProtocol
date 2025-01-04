import { readConfig } from "./helper.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'hardhat';
const {ethers, network} = pkg;


// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getZkVerification() {
    // Connect to the Ethereum network (replace with your preferred provider)
    const provider = new ethers.providers.JsonRpcProvider(network.config.url);

    const zkServiceAddress = await readConfig(network.name, "ZK_SERVICE");

    // Read the ABI from the compiled artifacts
    const artifactsPath = path.join(__dirname, '../artifacts/contracts/interfaces/IZkService.sol/IZkService.json');
    const artifactsJson = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'));
    const abi = artifactsJson.abi;

    const [signer] = await ethers.getSigners();
    console.log("signer ", signer.address);
    // Create a contract instance
    const zkServiceContract = new ethers.Contract(zkServiceAddress, abi, signer);
    try {
        // Call the submitArbitration method

        const pubKey = "0x024b84ffd1896c96a8f81fc874c2b5b4a2051c50b1a8dd350de8ea03bb89484672";
        const rawData = "0x02000000000101fc30133017f0af270ff8f3392e5c90617f6dddd8ab9c1d491fc6e94ab97d721d00000000000000000001c1260000000000001976a9149b42587007f85e456b5d0d702e828f34ea1f55b188ac0547304402202ae9abf3dfae7c40740111475e4eb854e3f7fd44393463be543b19f6c42a2a0f02207cfbc295a3b8b6adc74f3d250620f1e00a92dc275d29a18b00bdca95742b602b0147304402202ae9abf3dfae7c40740111475e4eb854e3f7fd44393463be543b19f6c42a2a0f02207cfbc295a3b8b6adc74f3d250620f1e00a92dc275d29a18b00bdca95742b602b01010100fd0a0163210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad21020d983021f335423a077bc62ddcbb8f18163959333747cdb079d116ecb45bffb0ac6763210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ad21024b84ffd1896c96a8f81fc874c2b5b4a2051c50b1a8dd350de8ea03bb89484672ac676303b60040b27521020d983021f335423a077bc62ddcbb8f18163959333747cdb079d116ecb45bffb0ada8205a0737e8cbcfa24dcc118b0ab1e6d98bee17c57daa8a1686024159aae707ed6f876703bd0040b275210250a9449960929822ac7020f92aad17cdd1c74c6db04d9f383b3c77489d753d19ac68686800000000";
        const utxos = ["0x0200000001c01632c0ae3e75823a5993cc638f2734bcb699589d745751845aaffe27dd2fb1010000006a47304402200f6949bbd5aa1d4d6d2156a9526768e8a03ad7fc4f825d810447c77e41345bab022073eb46701f6332d47f054256773e5bfd953dd872e76704c69bfb74f8c94809450121036739c7b375844db641e5037bee466e7a79e32e40f2a90fc9e76bad3d91d5c0c5ffffffff02e7290000000000002200204a0a6531a3c6a40a765c33f0df27ecccc559990b9db9c1b7681d676f865bbaf4e33d0300000000001976a914cb539f4329eeb589e83659c8304bcc6c99553a9688ac00000000"];
        const inputIndex = 0;
        const signatureIndex = 0;
        const tx = await zkServiceContract.submitArbitration(pubKey, rawData, utxos, inputIndex, signatureIndex);
        await tx.wait();
        console.log('Transaction Hash:', tx.hash);

    } catch (error) {
        console.error('Error fetching ZK verification:', error);
        throw error;
    }
}

//run verification
getZkVerification()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

export { getZkVerification };