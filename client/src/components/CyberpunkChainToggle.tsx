import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { getChainConfig, DEFAULT_CHAINS } from "@shared/chainConfig";
import type { ChainId } from "@shared/chainConfig";

interface CyberpunkChainToggleProps {
  selectedChain: ChainId;
  onChainChange: (chainId: ChainId) => void;
}

const chainDescriptions: Record<ChainId, { title: string; subtitle: string; description: string }> = {
  1: {
    title: "ETHEREUM",
    subtitle: "Premium Layer",
    description:
      "High-value, canonical, one-of-one releases. Best for treasury-grade assets, exclusive drops, and legacy works. Immutable on the most secure blockchain.",
  },
  137: {
    title: "POLYGON",
    subtitle: "Mass Mint Layer",
    description:
      "Fast, cheap, creator-friendly minting. Best for comics, NSFW sets, trading cards, and high-volume content. Scale your drops without breaking the bank.",
  },
  11155111: {
    title: "ETHEREUM SEPOLIA",
    subtitle: "Testnet",
    description: "Ethereum testnet for development and testing. Use for free test mints before going live on mainnet.",
  },
  80002: {
    title: "POLYGON AMOY",
    subtitle: "Testnet",
    description: "Polygon testnet for development and testing. Use for free test mints before going live on mainnet.",
  },
};

export default function CyberpunkChainToggle({
  selectedChain,
  onChainChange,
}: CyberpunkChainToggleProps) {
  const [expandedChain, setExpandedChain] = useState<ChainId | null>(selectedChain);

  const handleChainSelect = (chainId: ChainId) => {
    onChainChange(chainId);
    setExpandedChain(chainId);
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-emerald-400 mb-2 font-mono tracking-wider">
          ▶ SELECT YOUR CHAIN
        </h2>
        <p className="text-sm text-emerald-300/60 font-mono">
          Choose where your pixels will live forever...
        </p>
      </div>

      {/* Chain Toggle Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEFAULT_CHAINS.map((chainId) => {
          const config = getChainConfig(chainId);
          const description = chainDescriptions[chainId];
          const isSelected = chainId === selectedChain;
          const isExpanded = chainId === expandedChain;

          return (
            <div
              key={chainId}
              className={`relative transition-all duration-300 ${
                isExpanded ? "md:col-span-2" : ""
              }`}
            >
              {/* Neon Border Effect */}
              <div
                className={`absolute inset-0 rounded-lg transition-all duration-300 ${
                  isSelected
                    ? "bg-gradient-to-r from-emerald-500/20 via-amber-500/20 to-emerald-500/20 shadow-lg shadow-emerald-500/50"
                    : "bg-transparent"
                }`}
                style={{
                  boxShadow: isSelected
                    ? "0 0 20px rgba(52, 211, 153, 0.5), inset 0 0 20px rgba(52, 211, 153, 0.1)"
                    : "none",
                }}
              />

              {/* Border */}
              <div
                className={`absolute inset-0 rounded-lg border-2 transition-all duration-300 ${
                  isSelected ? "border-emerald-400" : "border-emerald-600/30 hover:border-emerald-500/60"
                }`}
              />

              {/* Content */}
              <div className="relative p-4 md:p-6 rounded-lg">
                {/* Chain Header */}
                <button
                  onClick={() => handleChainSelect(chainId)}
                  className="w-full text-left focus:outline-none group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-emerald-300 font-mono tracking-wider group-hover:text-emerald-200 transition-colors">
                        ⚡ {description.title}
                      </h3>
                      <p className="text-xs md:text-sm text-amber-400 font-mono mt-1">
                        {description.subtitle}
                      </p>
                    </div>
                    <div
                      className={`text-emerald-400 transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  <div className="flex items-center gap-2 mt-3">
                    <div
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        isSelected
                          ? "bg-emerald-400 shadow-lg shadow-emerald-400/50"
                          : "bg-emerald-600/40"
                      }`}
                    />
                    <span className="text-xs font-mono text-emerald-400/70">
                      {isSelected ? "SELECTED" : "AVAILABLE"}
                    </span>
                  </div>
                </button>

                {/* Expanded Description */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-emerald-600/30 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-emerald-200/80 font-mono leading-relaxed">
                      {description.description}
                    </p>

                    {/* Chain Stats */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-emerald-950/40 rounded p-2 border border-emerald-600/20">
                        <p className="text-xs text-emerald-400/60 font-mono">Gas Price</p>
                        <p className="text-sm font-bold text-emerald-300 font-mono">
                          {config.gasSettings?.gasPrice || "20 Gwei"}
                        </p>
                      </div>
                      <div className="bg-emerald-950/40 rounded p-2 border border-emerald-600/20">
                        <p className="text-xs text-emerald-400/60 font-mono">Network</p>
                        <p className="text-sm font-bold text-emerald-300 font-mono">
                          {config.name}
                        </p>
                      </div>
                    </div>

                    {/* Select Button */}
                    {!isSelected && (
                      <button
                        onClick={() => handleChainSelect(chainId)}
                        className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-amber-500/20 border border-emerald-400 text-emerald-300 font-mono text-sm font-bold rounded hover:from-emerald-500/40 hover:to-amber-500/40 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300"
                      >
                        ▶ SELECT {description.title}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="text-center text-xs text-emerald-400/50 font-mono mt-6 p-3 border border-emerald-600/20 rounded bg-emerald-950/20">
        💾 Your selection will determine gas costs, speed, and audience reach.
      </div>
    </div>
  );
}
