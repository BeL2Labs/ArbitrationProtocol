const fs = require('fs')
const path = require('path')
const bitcoin = require('bitcoinjs-lib');
const {publicKeyCreate} = require("secp256k1");

const writeConfig = async (toFile, key, value) => {
    let fromFullFile = getPath(toFile);
    if (fs.existsSync(fromFullFile) === false) {
        fs.writeFileSync(fromFullFile, "{}", { encoding: 'utf8' }, err => {})
    }

    let contentText = fs.readFileSync(fromFullFile,'utf-8');
    if (contentText === "") {
        contentText = "{}";
    }
    let data = JSON.parse(contentText);
    data[key] = value;

    let toFullFile = getPath(toFile);
    fs.writeFileSync(toFullFile, JSON.stringify(data, null, 4), { encoding: 'utf8' }, err => {})
}

const readConfig = async (fromFile,key) => {
    let fromFullFile = path.resolve(getConfigPath(), './' + fromFile + '.json')
    let contentText = fs.readFileSync(fromFullFile,'utf-8');
    let data = JSON.parse(contentText);
    return data[key];
}

function getPath(fromFile){
    let dir =  path.resolve(__dirname, './config');
    if (fs.existsSync(dir) == false) {
        fs.mkdirSync(dir)
    }
    return path.resolve(__dirname, './config/' + fromFile + '.json');
}

const getConfigPath = () => {
    return path.resolve(__dirname, '.') + "/./config"
}
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getBitcoinCredentials(privateKey) {
    try {
      // Convert Ethereum private key to Buffer (remove '0x' prefix if present)
      const privKeyBuffer = Buffer.from(privateKey.replace('0x', ''), 'hex');
  
      const pubKey = publicKeyCreate(privKeyBuffer, true);
  
      // Create legacy address (P2PKH)
      const { address } = bitcoin.payments.p2pkh({ 
        pubkey: pubKey,
        network: bitcoin.networks.bitcoin
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

module.exports = {
    writeConfig,
    readConfig,
    sleep,
    getBitcoinCredentials
}