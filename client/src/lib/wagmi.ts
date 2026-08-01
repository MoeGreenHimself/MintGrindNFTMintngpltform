import { createConfig, http } from "wagmi";
import { mainnet, polygon, sepolia, polygonAmoy } from "wagmi/chains";
import { injected, metaMask, coinbaseWallet, walletConnect } from "@wagmi/connectors";

/**
 * Wagmi configuration for multi-chain support
 * Supports Ethereum, Polygon, and their testnets
 */
export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, sepolia, polygonAmoy],
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet(),
    walletConnect({
      projectId: process.env.VITE_WALLET_CONNECT_PROJECT_ID || "default",
    }),
  ],
  transports: {
    [mainnet.id]: http(process.env.VITE_ETHEREUM_RPC_URL),
    [polygon.id]: http(process.env.VITE_POLYGON_RPC_URL),
    [sepolia.id]: http(process.env.VITE_SEPOLIA_RPC_URL),
    [polygonAmoy.id]: http(process.env.VITE_AMOY_RPC_URL),
  },
});



/**
 * Map wagmi chain IDs to our internal ChainId type
 */
export const chainIdMap: Record<number, number> = {
  [mainnet.id]: 1,
  [polygon.id]: 137,
  [sepolia.id]: 11155111,
  [polygonAmoy.id]: 80002,
};

/**
 * Get internal chain ID from wagmi chain ID
 */
export function getInternalChainId(wagmiChainId: number): number {
  return chainIdMap[wagmiChainId] || wagmiChainId;
}
