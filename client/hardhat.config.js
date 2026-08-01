import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import "dotenv/config";

const config = defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
          evmVersion: "paris"
        }
      }
    ]
  },
  networks: {
    sepolia: {
      url: "https://publicnode.com",
      type: "http",
      accounts: process.env.TESTNET_DEPLOYER_KEY ? [process.env.TESTNET_DEPLOYER_KEY] : [],
    },
    amoy: {
      url: "https://publicnode.com",
      type: "http",
      accounts: process.env.TESTNET_DEPLOYER_KEY ? [process.env.TESTNET_DEPLOYER_KEY] : [],
    },
  },
});

export default config;