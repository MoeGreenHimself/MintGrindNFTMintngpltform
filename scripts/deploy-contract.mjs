#!/usr/bin/env node

import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * MintGrindNFT Contract Deployment Script
 *
 * Usage:
 *   node scripts/deploy-contract.mjs --network sepolia --private-key <key> --signer <address>
 *
 * Environment Variables:
 *   SEPOLIA_RPC_URL - RPC endpoint for Sepolia testnet
 *   POLYGON_AMOY_RPC_URL - RPC endpoint for Polygon Amoy testnet
 */

const NETWORKS = {
  sepolia: {
    rpcUrl: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    chainId: 11155111,
    name: "Ethereum Sepolia",
  },
  polygonAmoy: {
    rpcUrl: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
    chainId: 80002,
    name: "Polygon Amoy",
  },
};

async function deployContract() {
  const args = process.argv.slice(2);
  const networkArg = args.find((arg) => arg.startsWith("--network"))?.split("=")[1] || "sepolia";
  const privateKeyArg = args.find((arg) => arg.startsWith("--private-key"))?.split("=")[1];
  const signerArg = args.find((arg) => arg.startsWith("--signer"))?.split("=")[1];

  if (!privateKeyArg) {
    console.error("❌ Error: --private-key is required");
    console.log("\nUsage: node scripts/deploy-contract.mjs --network sepolia --private-key <key> --signer <address>");
    process.exit(1);
  }

  if (!signerArg) {
    console.error("❌ Error: --signer is required (address that will sign mint messages)");
    process.exit(1);
  }

  const network = NETWORKS[networkArg];
  if (!network) {
    console.error(`❌ Error: Unknown network "${networkArg}". Supported: ${Object.keys(NETWORKS).join(", ")}`);
    process.exit(1);
  }

  console.log(`\n🚀 Deploying MintGrindNFT to ${network.name}...`);
  console.log(`📡 RPC: ${network.rpcUrl}`);
  console.log(`🔑 Signer: ${signerArg}`);

  try {
    // Initialize provider and signer
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    const deployer = new ethers.Wallet(privateKeyArg, provider);

    console.log(`\n💼 Deployer: ${deployer.address}`);

    // Get deployer balance
    const balance = await provider.getBalance(deployer.address);
    const balanceEth = ethers.formatEther(balance);
    console.log(`💰 Balance: ${balanceEth} ETH`);

    if (parseFloat(balanceEth) < 0.1) {
      console.error("❌ Error: Insufficient balance. Need at least 0.1 ETH for deployment.");
      process.exit(1);
    }

    // Contract constructor arguments
    const contractArgs = {
      name_: "MintGrind NFT",
      symbol_: "MGND",
      mintPrice_: ethers.parseEther("0.01"), // 0.01 ETH
      maxSupply_: 10000,
      maxPerWallet_: 10,
      signer_: signerArg,
      initialOwner_: deployer.address,
      targetChainId_: network.chainId,
      payees_: [deployer.address], // Single payee for testing
      shares_: [100], // 100% to deployer
    };

    console.log("\n📋 Contract Arguments:");
    console.log(`  Name: ${contractArgs.name_}`);
    console.log(`  Symbol: ${contractArgs.symbol_}`);
    console.log(`  Mint Price: ${ethers.formatEther(contractArgs.mintPrice_)} ETH`);
    console.log(`  Max Supply: ${contractArgs.maxSupply_}`);
    console.log(`  Max Per Wallet: ${contractArgs.maxPerWallet_}`);
    console.log(`  Signer: ${contractArgs.signer_}`);
    console.log(`  Owner: ${contractArgs.initialOwner_}`);
    console.log(`  Chain ID: ${contractArgs.targetChainId_}`);

    // Load contract ABI and bytecode
    // Note: In production, you would load this from compiled contract files
    console.log("\n⚠️  Note: Contract bytecode must be provided separately.");
    console.log("   This script requires the compiled MintGrindNFT contract.");
    console.log("   Please compile the contract using: npx hardhat compile");

    // Example deployment (commented out without actual bytecode)
    /*
    const MintGrindNFT = new ethers.ContractFactory(ABI, BYTECODE, deployer);
    console.log("\n⏳ Deploying contract...");
    const contract = await MintGrindNFT.deploy(
      contractArgs.name_,
      contractArgs.symbol_,
      contractArgs.mintPrice_,
      contractArgs.maxSupply_,
      contractArgs.maxPerWallet_,
      contractArgs.signer_,
      contractArgs.initialOwner_,
      contractArgs.targetChainId_,
      contractArgs.payees_,
      contractArgs.shares_
    );

    await contract.waitForDeployment();
    const address = await contract.getAddress();

    console.log(`\n✅ Contract deployed successfully!`);
    console.log(`📍 Address: ${address}`);
    console.log(`🔗 Explorer: https://${networkArg === "sepolia" ? "sepolia." : "amoy."}etherscan.io/address/${address}`);

    // Save deployment info
    const deploymentInfo = {
      network: networkArg,
      chainId: network.chainId,
      address,
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      contractArgs,
    };

    const deploymentFile = path.join(__dirname, `../deployments/${networkArg}-deployment.json`);
    fs.mkdirSync(path.dirname(deploymentFile), { recursive: true });
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

    console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);
    */

    console.log("\n✅ Deployment script ready. Add contract bytecode to proceed.");
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

deployContract();
