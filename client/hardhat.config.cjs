require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const config = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: "https://publicnode.com",
      accounts: process.env.TESTNET_DEPLOYER_KEY ? [process.env.TESTNET_DEPLOYER_KEY] : [],
    },
    amoy: {
      url: "https://publicnode.com",
      accounts: process.env.TESTNET_DEPLOYER_KEY ? [process.env.TESTNET_DEPLOYER_KEY] : [],
    }
  }
};

module.exports = config;