import { ethers } from "ethers";
import { getChainConfig } from "@shared/chainConfig";
import type { ChainId } from "@shared/chainConfig";

interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  gasCost: string;
  totalCostUSD: string;
  chainName: string;
}

interface MintingCosts {
  mintingFee: string; // Your platform fee in USD
  gasCost: string; // Estimated gas cost in USD
  totalCost: string; // Total in USD
  breakdown: {
    mintingFeeUSD: number;
    gasCostUSD: number;
    totalUSD: number;
  };
}

// Gas price multipliers (adjust based on network conditions)
const GAS_PRICE_MULTIPLIERS: Record<ChainId, number> = {
  1: 1.2, // Ethereum mainnet - higher multiplier for safety
  137: 1.1, // Polygon - lower multiplier
  11155111: 1.0, // Sepolia testnet
  80002: 1.0, // Polygon Amoy testnet
};

// Estimated gas for mint function (adjust based on actual contract)
const MINT_GAS_LIMIT = 250000; // ~250k gas for ERC721A mint

// USD prices for tokens (these should come from an oracle in production)
const TOKEN_PRICES: Record<string, number> = {
  ETH: 2500, // Example: $2500 per ETH
  MATIC: 0.8, // Example: $0.80 per MATIC
  USDC: 1.0, // Stablecoin
  USDT: 1.0, // Stablecoin
};

/**
 * Estimate gas costs for minting on a specific chain
 */
export async function estimateGasCost(chainId: ChainId): Promise<GasEstimate> {
  try {
    const chainConfig = getChainConfig(chainId);
    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);

    // Get current gas price
    const feeData = await provider.getFeeData();
    if (!feeData.gasPrice) {
      throw new Error("Unable to fetch gas price");
    }

    // Apply multiplier for safety margin
    const multiplier = GAS_PRICE_MULTIPLIERS[chainId] || 1.0;
    const adjustedGasPrice = feeData.gasPrice * BigInt(Math.floor(multiplier * 100)) / BigInt(100);

    // Calculate total gas cost
    const gasLimit = BigInt(MINT_GAS_LIMIT);
    const gasCostWei = adjustedGasPrice * gasLimit;
    const gasCostEther = ethers.formatEther(gasCostWei);

    // Convert to USD
    const nativeTokenPrice = chainId === 137 ? TOKEN_PRICES.MATIC : TOKEN_PRICES.ETH;
    const gasCostUSD = parseFloat(gasCostEther) * nativeTokenPrice;

    return {
      gasLimit: gasLimit.toString(),
      gasPrice: ethers.formatUnits(adjustedGasPrice, "gwei"),
      gasCost: gasCostEther,
      totalCostUSD: gasCostUSD.toFixed(2),
      chainName: chainConfig.name,
    };
  } catch (error) {
    console.error("[GasEstimator] Error estimating gas:", error);
    // Return fallback estimate
    return {
      gasLimit: MINT_GAS_LIMIT.toString(),
      gasPrice: "50", // gwei - fallback
      gasCost: "0.0125", // ETH - fallback
      totalCostUSD: "31.25", // USD - fallback
      chainName: "Unknown",
    };
  }
}

/**
 * Calculate total minting costs including platform fee
 */
export async function calculateMintingCosts(
  chainId: ChainId,
  platformFeeUSD: number = 2.99 // Default $2.99 platform fee
): Promise<MintingCosts> {
  const gasEstimate = await estimateGasCost(chainId);
  const gasCostUSD = parseFloat(gasEstimate.totalCostUSD);
  const totalUSD = platformFeeUSD + gasCostUSD;

  return {
    mintingFee: platformFeeUSD.toFixed(2),
    gasCost: gasCostUSD.toFixed(2),
    totalCost: totalUSD.toFixed(2),
    breakdown: {
      mintingFeeUSD: platformFeeUSD,
      gasCostUSD,
      totalUSD,
    },
  };
}

/**
 * Get estimated cost in native token (ETH/MATIC)
 */
export async function getEstimatedCostInNativeToken(
  chainId: ChainId,
  costUSD: number
): Promise<string> {
  const nativeTokenPrice = chainId === 137 ? TOKEN_PRICES.MATIC : TOKEN_PRICES.ETH;
  const costInToken = costUSD / nativeTokenPrice;
  return costInToken.toFixed(6);
}
