import { ethers } from "ethers";
import { getChainConfig } from "@shared/chainConfig";
import type { ChainId } from "@shared/chainConfig";

/**
 * MintGrindNFT contract ABI (minimal interface for minting)
 */
const MINT_GRIND_NFT_ABI = [
  {
    name: "mint",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "quantity", type: "uint256" },
      { name: "expiry", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "maxSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "minted",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "mintPrice",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
];

/**
 * Get contract instance for reading data
 */
export function getContractReader(chainId: ChainId) {
  const chainConfig = getChainConfig(chainId);
  const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);

  return new ethers.Contract(
    chainConfig.contractAddress,
    MINT_GRIND_NFT_ABI,
    provider
  );
}

/**
 * Get contract instance for writing data (requires signer)
 */
export function getContractWriter(chainId: ChainId, signer: ethers.Signer) {
  const chainConfig = getChainConfig(chainId);

  return new ethers.Contract(
    chainConfig.contractAddress,
    MINT_GRIND_NFT_ABI,
    signer
  );
}

/**
 * Fetch contract supply information
 */
export async function getSupplyInfo(chainId: ChainId) {
  try {
    const contract = getContractReader(chainId);

    const [totalSupply, maxSupply, mintPrice] = await Promise.all([
      contract.totalSupply(),
      contract.maxSupply(),
      contract.mintPrice(),
    ]);

    return {
      totalSupply: Number(totalSupply),
      maxSupply: Number(maxSupply),
      mintPrice: mintPrice.toString(),
      remainingSupply: Number(maxSupply) - Number(totalSupply),
    };
  } catch (error) {
    console.error("[Contract] Error fetching supply info:", error);
    throw error;
  }
}

/**
 * Fetch user's minted count on a chain
 */
export async function getUserMintedCount(walletAddress: string, chainId: ChainId) {
  try {
    const contract = getContractReader(chainId);
    const mintedCount = await contract.minted(walletAddress);
    return Number(mintedCount);
  } catch (error) {
    console.error("[Contract] Error fetching minted count:", error);
    throw error;
  }
}

/**
 * Execute mint transaction
 */
export async function executeMint(
  signer: ethers.Signer,
  chainId: ChainId,
  quantity: number,
  expiryTime: number,
  signature: string,
  mintPrice: string
) {
  try {
    const contract = getContractWriter(chainId, signer);

    // Calculate total amount to send
    const totalAmount = BigInt(mintPrice) * BigInt(quantity);

    // Execute mint
    const tx = await contract.mint(quantity, expiryTime, signature, {
      value: totalAmount,
    });

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("Transaction failed");
    }

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    console.error("[Contract] Error executing mint:", error);
    throw error;
  }
}

/**
 * Estimate gas for mint transaction
 */
export async function estimateMintGas(
  walletAddress: string,
  chainId: ChainId,
  quantity: number,
  expiryTime: number,
  signature: string
) {
  try {
    const chainConfig = getChainConfig(chainId);
    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);

    const contract = new ethers.Contract(
      chainConfig.contractAddress,
      MINT_GRIND_NFT_ABI,
      provider
    );

    // Get current mint price
    const mintPrice = await contract.mintPrice();
    const totalAmount = mintPrice * BigInt(quantity);

    // Estimate gas
    const gasEstimate = await provider.estimateGas({
      to: chainConfig.contractAddress,
      from: walletAddress,
      data: contract.interface.encodeFunctionData("mint", [
        quantity,
        expiryTime,
        signature,
      ]),
      value: totalAmount,
    });

    const gasPrice = chainConfig.gasSettings?.gasPrice || "20000000000"; // 20 Gwei default
    return {
      estimatedGas: gasEstimate.toString(),
      gasPrice,
      estimatedCost: (gasEstimate * BigInt(gasPrice)).toString(),
    };
  } catch (error) {
    console.error("[Contract] Error estimating gas:", error);
    throw error;
  }
}
