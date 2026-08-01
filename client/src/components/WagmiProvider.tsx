import { ReactNode } from "react";
import { WagmiProvider as WagmiProviderBase, createConfig, http } from "wagmi";
import { mainnet, polygon, sepolia, polygonAmoy } from "wagmi/chains";
import { metaMask, coinbaseWallet, walletConnect } from "wagmi/connectors";

// Create wagmi config with multi-chain support
const config = createConfig({
  chains: [mainnet, sepolia, polygon, polygonAmoy],
  connectors: [
    metaMask(),
    coinbaseWallet({
      appName: "MintGrind.exe",
      appLogoUrl: "/mintgrind-logo.png",
    }),
    walletConnect({
      projectId: process.env.VITE_WALLET_CONNECT_PROJECT_ID || "default",
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
  },
});

interface WagmiProviderProps {
  children: ReactNode;
}

export function WagmiProvider({ children }: WagmiProviderProps) {
  return <WagmiProviderBase config={config}>{children}</WagmiProviderBase>;
}
