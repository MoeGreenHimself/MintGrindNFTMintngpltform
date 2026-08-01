import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { getInternalChainId } from "@/lib/wagmi";
import type { ChainId } from "@shared/chainConfig";

/**
 * Custom hook for managing wallet connection and chain switching
 * Integrates with wagmi for multi-chain support
 */
export function useWalletConnection() {
  const { address, isConnected, chainId: wagmiChainId } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect, isPending: isDisconnecting } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const [internalChainId, setInternalChainId] = useState<ChainId | undefined>();

  // Update internal chain ID when wagmi chain ID changes
  useEffect(() => {
    if (wagmiChainId) {
      const chainId = getInternalChainId(wagmiChainId);
      setInternalChainId(chainId as ChainId);
    }
  }, [wagmiChainId]);

  const handleConnect = (connectorName?: string) => {
    const connector = connectorName
      ? connectors.find((c) => c.name.toLowerCase() === connectorName.toLowerCase())
      : connectors[0];

    if (connector) {
      connect({ connector });
    }
  };

  const handleSwitchChain = async (targetChainId: ChainId) => {
    // Map internal chain ID back to wagmi chain ID
    const chainIdMap: Record<number, number> = {
      1: 1, // Ethereum
      137: 137, // Polygon
      11155111: 11155111, // Sepolia
      80002: 80002, // Amoy
    };

    const wagmiChainId = chainIdMap[targetChainId];
    if (wagmiChainId) {
      switchChain({ chainId: wagmiChainId });
    }
  };

  return {
    // Connection state
    address,
    isConnected,
    chainId: internalChainId,
    wagmiChainId,

    // Connection methods
    connect: handleConnect,
    disconnect,
    switchChain: handleSwitchChain,

    // Loading states
    isConnecting,
    isDisconnecting,
    isSwitching,

    // Available connectors
    connectors: connectors.map((c) => ({
      name: c.name,
      id: c.id,
    })),
  };
}
