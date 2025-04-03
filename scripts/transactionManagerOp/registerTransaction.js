const { ethers, network } = require("hardhat");
const { readConfig } = require("../helper.js");

async function main() {
    let [deployer, receiver] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    // Get the contract factory for TransactionManager
    const TransactionManager = await ethers.getContractFactory("TransactionManager");

    // Get the transaction manager address from config
    const transactionManagerAddress = await readConfig(network.name, "TRANSACTION_MANAGER");
    console.log("Transaction Manager Address:", transactionManagerAddress);
    
    // Connect to the deployed contract
    const transactionManager = TransactionManager.attach(transactionManagerAddress);

    // Parameters for registerTransaction
    const arbitratorAddress = "0x3Cf0BB575527cACf9e274a6eE879f876Dae0BC40";
    const compensationReceiverAddress = receiver.address;
    const deadline = Math.floor(Date.now() / 1000) + 3600 * 24 + 180; // 1 days from now
    const value = ethers.utils.parseEther("0.1");
    // Log detailed transaction parameters
    const utxos = [{
        txHash: ethers.utils.randomBytes(32),
        index: 0,
        script: ethers.utils.randomBytes(20),
        amount: ethers.utils.parseEther("1")
    }];
    console.log("Transaction Parameters:");
    console.log("Arbitrator Address:", arbitratorAddress);
    console.log("Compensation Receiver Address:", compensationReceiverAddress);
    console.log("Deadline:", deadline);
    console.log("Value:", value);
    const registerData = {
        arbitrator: arbitratorAddress,
        deadline: deadline,
        compensationReceiver: compensationReceiverAddress,
        refundAddress: receiver.address
    }
    let gasLimit = await transactionManager.estimateGas.registerTransaction(
        registerData,
        {value: value}
    );
    console.log("Gas Limit:", gasLimit);
    return;
    // Call registerTransaction directly with transaction options
    const tx = await transactionManager.registerTransaction(
        registerData,
        {
            value: value,
            gasLimit: gasLimit
        }
    );

    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    // Log the transaction details
    console.log("Transaction registered successfully!");
    console.log("Transaction Hash:", tx.hash);
    console.log("Block Number:", receipt.blockNumber);
        
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
