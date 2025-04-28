require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-deploy");
require("dotenv").config();

const { staging_key, prod_key, operator_key } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    stake_prod: {
      url: "https://api.elastos.io/esc",
      accounts: [...(prod_key ? [prod_key, operator_key] : [])]
    },
    stake_mainnet: {
      url: "https://api.elastos.io/esc",
      accounts: [...(staging_key ? [staging_key, operator_key] : [])]
    },
    stake_testnet: {
      url: "https://api-testnet.elastos.io/esc",
      accounts: [...(staging_key ? [staging_key, operator_key] : [])],
    },
    hardhat: {
      chainId: 100,
      accounts: [
        ...(staging_key ? [{ privateKey: staging_key, balance: "10000000000000000000000" }] : []),
        ...(prod_key ? [{ privateKey: prod_key, balance: "10000000000000000000000" }] : []),
        ...(operator_key ? [{ privateKey: operator_key, balance: "10000000000000000000000" }] : []),
      ],
      blockGasLimit: 8000000
    }
  },
  etherscan: {
    apiKey: {
      'stake_testnet': 'empty',
      "stake_mainnet": "empty",
    },
    customChains: [
      {
        network: "stake_testnet",
        chainId: 21,
        urls: {
          apiURL: "https://esc-testnet.elastos.io:443/api",
          browserURL: "https://esc-testnet.elastos.io:443"
        }
      },
      {
        network: "stake_mainnet",
        chainId: 20,
        urls: {
          apiURL: "https://esc.elastos.io:443/api",
          browserURL: "https://esc.elastos.io:443"
        }
      }
    ]
  },
};
