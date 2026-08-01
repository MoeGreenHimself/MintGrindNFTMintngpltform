import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logo?: string;
}

interface TokenSelectorProps {
  selectedToken: Token | null;
  onTokenSelect: (token: Token) => void;
  chainId: number;
}

const POPULAR_TOKENS: Record<number, Token[]> = {
  1: [
    { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", name: "Ethereum", decimals: 18 },
    { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", name: "USD Coin", decimals: 6 },
    { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", name: "Tether", decimals: 6 },
    { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
    { address: "0x2260FAC5E5542a773Aa44fBCfeDd66d7D1d0eD3E", symbol: "WBTC", name: "Wrapped Bitcoin", decimals: 8 },
  ],
  137: [
    { address: "0x0000000000000000000000000000000000000000", symbol: "MATIC", name: "Polygon", decimals: 18 },
    { address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", symbol: "USDC", name: "USD Coin", decimals: 6 },
    { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", symbol: "USDT", name: "Tether", decimals: 6 },
    { address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023D60d76546", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
    { address: "0x1bfd67037b42cf73acF2047067bd4303c2c626726", symbol: "WBTC", name: "Wrapped Bitcoin", decimals: 8 },
  ],
  11155111: [
    { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", name: "Ethereum (Sepolia)", decimals: 18 },
  ],
  80002: [
    { address: "0x0000000000000000000000000000000000000000", symbol: "MATIC", name: "Polygon (Amoy)", decimals: 18 },
  ],
};

export default function TokenSelector({
  selectedToken,
  onTokenSelect,
  chainId,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customAddress, setCustomAddress] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const availableTokens = POPULAR_TOKENS[chainId] || [];

  const handleAddCustomToken = () => {
    if (!customAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      alert("Invalid token address");
      return;
    }

    const customToken: Token = {
      address: customAddress,
      symbol: "CUSTOM",
      name: "Custom Token",
      decimals: 18,
    };

    onTokenSelect(customToken);
    setCustomAddress("");
    setShowCustomInput(false);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-emerald-400/70 font-mono">PAYMENT TOKEN</label>

      <div className="relative">
        {/* Selected Token Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-black border border-emerald-500/30 rounded text-emerald-300 font-mono text-sm flex items-center justify-between hover:border-emerald-400/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            {selectedToken ? (
              <>
                <span className="text-emerald-400 font-bold">{selectedToken.symbol}</span>
                <span className="text-emerald-300/70">{selectedToken.name}</span>
              </>
            ) : (
              <span className="text-emerald-300/50">Select a token...</span>
            )}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-emerald-500/30 rounded shadow-lg z-50 space-y-1 p-2">
            {/* Popular Tokens */}
            {availableTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => {
                  onTokenSelect(token);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left rounded text-sm font-mono transition-colors ${
                  selectedToken?.address === token.address
                    ? "bg-emerald-500/20 border border-emerald-400 text-emerald-300"
                    : "bg-emerald-950/10 border border-emerald-600/20 text-emerald-300/70 hover:bg-emerald-950/20 hover:border-emerald-500/30"
                }`}
              >
                <span className="font-bold">{token.symbol}</span>
                <span className="text-xs text-emerald-300/50 ml-2">{token.name}</span>
              </button>
            ))}

            {/* Divider */}
            <div className="border-t border-emerald-600/20 my-2" />

            {/* Custom Token Input */}
            {!showCustomInput ? (
              <button
                onClick={() => setShowCustomInput(true)}
                className="w-full px-3 py-2 text-left rounded text-sm font-mono text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-950/10 transition-colors"
              >
                + Add Custom Token
              </button>
            ) : (
              <div className="space-y-2 p-2">
                <Input
                  type="text"
                  placeholder="0x..."
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  className="bg-black border-emerald-500/30 text-emerald-300 placeholder-emerald-500/30 font-mono text-xs"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddCustomToken}
                    className="flex-1 px-2 py-1 bg-emerald-500/20 border border-emerald-400 text-emerald-300 rounded text-xs font-mono hover:bg-emerald-500/30"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomAddress("");
                    }}
                    className="flex-1 px-2 py-1 bg-emerald-950/20 border border-emerald-600/20 text-emerald-300/70 rounded text-xs font-mono hover:bg-emerald-950/30"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Token Info */}
      {selectedToken && (
        <div className="text-xs text-emerald-300/60 font-mono space-y-1">
          <p>Address: {selectedToken.address.slice(0, 10)}...{selectedToken.address.slice(-8)}</p>
          <p>Decimals: {selectedToken.decimals}</p>
        </div>
      )}
    </div>
  );
}
