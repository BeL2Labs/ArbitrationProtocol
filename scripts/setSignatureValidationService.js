const { ethers,network } = require('hardhat');
const { readConfig } = require('./helper');

async function main() {
    const SIGNATURE_VALIDATION_SERVICE = await readConfig(network.name, 'SIGNATURE_VALIDATION_SERVICE');
    const compensationManagerAddress = await readConfig(network.name, "COMPENSATION_MANAGER"); 
    const [deployer] = await ethers.getSigners();

    console.log('Deploying contracts with the account:', deployer.address);

    const CompensationManager = await ethers.getContractFactory('CompensationManager');
    const compensationManager = await CompensationManager.attach(compensationManagerAddress);

    console.log('Setting Signature Validation Service...');
    const tx = await compensationManager.setSignatureValidationService(SIGNATURE_VALIDATION_SERVICE);
    await tx.wait();
    console.log('tx.hash:', tx.hash);
    console.log('Signature Validation Service set to:', SIGNATURE_VALIDATION_SERVICE);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
