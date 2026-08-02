import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OWNER_ADDRESS = "0x3Cec101153d84b4686BeEA4de0e99e08004A3fa0";
const SEPOLIA_RPC = "https://sepolia.org";
const AMOY_RPC = "https://polygon.technology";

async function deployToTestnet(chainName, rpcUrl, chainId) {
  console.log(`\n🚀 Starting actual deployment to ${chainName}...`);

  try {
    // 1. Automatically load your compiled artifacts from Hardhat
    const artifactPath = path.join(__dirname, "../artifacts/contracts/MintGrindNFT_v2.1.sol/MintGrindNFT.json");
    if (!fs.existsSync(artifactPath)) {
      console.error(`❌ Error: Artifacts missing. Run 'npx hardhat compile' first.`);
      return;
    }
    const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const ABI = contractArtifact.abi;
    const BYTECODE = contractArtifact.bytecode;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const deployerPrivateKey = process.env.TESTNET_DEPLOYER_KEY;
    
    if (!deployerPrivateKey) {
      console.log(`⚠️  TESTNET_DEPLOYER_KEY env variable not set. Skipping execution.`);
      return;
    }

    const wallet = new ethers.Wallet(deployerPrivateKey, provider);
    console.log(`💼 Deployer Account: ${wallet.address}`);

    const deployParams = {
      name: "MintGrind NFT",
      symbol: "MGND",
      mintPrice: ethers.parseEther("0.01"), 
      maxSupply: 10000,
      maxPerWallet: 100,
      signer: wallet.address, // Wallet acts as its own signature creator for testing
      initialOwner: OWNER_ADDRESS,
      targetChainId: chainId,
      payees: [OWNER_ADDRESS],
      shares: [100],
      paymentToken: "0x0000000000000000000000000000000000000000" // address(0) = native token
    };

    console.log(`⏳ Submitting contract creation transaction...`);
    const MintGrindNFTFactory = new ethers.ContractFactory(ABI, BYTECODE, wallet);
    
    // Deploys with all 11 explicit parameters required by your v2.1 `.sol` contract
    const contract = await MintGrindNFTFactory.deploy(
      deployParams.name,
      deployParams.symbol,
      deployParams.mintPrice,
      deployParams.maxSupply,
      deployParams.maxPerWallet,
      deployParams.signer,
      deployParams.initialOwner,
      deployParams.targetChainId,
      deployParams.payees,
      deployParams.shares,
      deployParams.paymentToken
    );

    await contract.waitForDeployment();
    const deployedAddress = await contract.getAddress();
    console.log(`✅ Success! Deployed to ${chainName} at: ${deployedAddress}`);

  } catch (error) {
    console.error(`❌ Error deploying to ${chainName}:`, error.message);
  }
}

async function main() {
  console.log("🔗 MintGrind NFT Contract Deployment Engine");
  console.log("=".repeat(50));

  await deployToTestnet("Ethereum Sepolia", SEPOLIA_RPC, 11155111);
  await deployToTestnet("Polygon Amoy", AMOY_RPC, 80002);
}

main().catch(console.error);