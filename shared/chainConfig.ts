/**
 * Multi-chain configuration for MintGrind NFT minting platform
 * Supports Ethereum and Polygon networks with testnet and mainnet configurations
 */

export type ChainId = 1 | 137 | 11155111 | 80002; // Ethereum, Polygon, Sepolia, Amoy

export interface ChainConfig {
  id: ChainId;
  name: string;
  shortName: string;
  description: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contractAddress: string;
  signerDomain: {
    name: string;
    version: string;
    chainId: number;
  };
  gasSettings?: {
    gasPrice?: string;
    gasLimit?: string;
  };
}

export const CHAINS: Record<ChainId, ChainConfig> = {
  // Ethereum Mainnet
  1: {
    id: 1,
    name: "Ethereum",
    shortName: "ETH",
    description: "High-value, canonical, one-of-one releases. Best for treasury-grade assets, exclusive drops, and legacy works.",
    rpcUrl: "https://eth.llamarpc.com",
    blockExplorer: "https://etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    contractAddress: "0x0000000000000000000000000000000000000000",
    signerDomain: {
      name: "MintGrindNFT",
      version: "1.0.5",
      chainId: 1,
    },
  },

  // Polygon Mainnet
  137: {
    id: 137,
    name: "Polygon",
    shortName: "MATIC",
    description: "Fast, cheap, creator-friendly minting. Best for comics, NSFW sets, trading cards, and high-volume content.",
    rpcUrl: "https://polygon-rpc.com",
    blockExplorer: "https://polygonscan.com",
    nativeCurrency: {
      name: "Matic",
      symbol: "MATIC",
      decimals: 18,
    },
    contractAddress: "0x0000000000000000000000000000000000000000",
    signerDomain: {
      name: "MintGrindNFT",
      version: "1.0.5",
      chainId: 137,
    },
  },

  // Ethereum Sepolia Testnet
  11155111: {
    id: 11155111,
    name: "Ethereum Sepolia",
    shortName: "ETH",
    description: "Ethereum testnet for development and testing.",
    rpcUrl: "https://rpc.sepolia.org",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    contractAddress: "0x0000000000000000000000000000000000000000",
    signerDomain: {
      name: "MintGrindNFT",
      version: "1.0.5",
      chainId: 11155111,
    },
  },

  // Polygon Amoy Testnet
  80002: {
    id: 80002,
    name: "Polygon Amoy",
    shortName: "MATIC",
    description: "Polygon testnet for development and testing.",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    blockExplorer: "https://amoy.polygonscan.com",
    nativeCurrency: {
      name: "Amoy Matic",
      symbol: "MATIC",
      decimals: 18,
    },
    contractAddress: "0x0000000000000000000000000000000000000000",
    signerDomain: {
      name: "MintGrindNFT",
      version: "1.0.5",
      chainId: 80002,
    },
  },
};

export const SUPPORTED_CHAINS: ChainId[] = [1, 137, 11155111, 80002];
export const DEFAULT_CHAINS: ChainId[] = [11155111, 80002]; // Testnet defaults

export const getChainConfig = (chainId: ChainId): ChainConfig => {
  return CHAINS[chainId];
};

export const getChainName = (chainId: ChainId): string => {
  return CHAINS[chainId]?.name || "Unknown";
};

export const getChainCurrency = (chainId: ChainId): string => {
  return CHAINS[chainId]?.nativeCurrency.symbol || "ETH";
};
