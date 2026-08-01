import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Wallet } from "lucide-react";
import { getChainConfig, getChainName } from "@shared/chainConfig";
import type { ChainId } from "@shared/chainConfig";

interface WalletStatusDisplayProps {
  walletAddress?: string;
  connectedChainId?: ChainId;
  selectedChainId: ChainId;
  isConnected: boolean;
  onConnectWallet?: () => void;
  onSwitchChain?: (chainId: ChainId) => void;
  isLoading?: boolean;
}

export default function WalletStatusDisplay({
  walletAddress,
  connectedChainId,
  selectedChainId,
  isConnected,
  onConnectWallet,
  onSwitchChain,
  isLoading = false,
}: WalletStatusDisplayProps) {
  const selectedChainName = getChainName(selectedChainId);
  const connectedChainName = connectedChainId ? getChainName(connectedChainId) : "Unknown";
  const chainMismatch = isConnected && connectedChainId !== selectedChainId;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <Card className="border-amber-500 dark:border-amber-600 bg-amber-50 dark:bg-amber-950">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                  Wallet Not Connected
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-200 mt-1">
                  Connect your wallet to mint NFTs
                </p>
              </div>
            </div>
            <Button
              onClick={onConnectWallet}
              disabled={isLoading}
              size="sm"
              className="ml-2"
            >
              {isLoading ? "Connecting..." : "Connect"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chainMismatch) {
    return (
      <Card className="border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-sm text-red-900 dark:text-red-100">
                  Network Mismatch
                </h3>
                <p className="text-xs text-red-700 dark:text-red-200 mt-1">
                  Connected to {connectedChainName}, but selected {selectedChainName}
                </p>
              </div>
            </div>
            <Button
              onClick={() => onSwitchChain?.(selectedChainId)}
              disabled={isLoading}
              size="sm"
              variant="destructive"
              className="ml-2"
            >
              {isLoading ? "Switching..." : "Switch Network"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950">
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">
              Wallet Connected
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Wallet className="w-3 h-3 text-emerald-700 dark:text-emerald-200" />
              <p className="text-xs text-emerald-700 dark:text-emerald-200">
                {formatAddress(walletAddress || "")} on {selectedChainName}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
