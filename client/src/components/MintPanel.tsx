import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import ChainSelector from "./ChainSelector";
import DynamicMintPrice from "./DynamicMintPrice";
import SupplyIndicators from "./SupplyIndicators";
import SignatureStatusIndicator from "./SignatureStatusIndicator";
import WalletStatusDisplay from "./WalletStatusDisplay";
import PromoCodeInput from "./PromoCodeInput";
import { useMintingFlow } from "@/hooks/useMintingFlow";
import { getChainConfig, DEFAULT_CHAINS } from "@shared/chainConfig";
import type { ChainId } from "@shared/chainConfig";

interface MintPanelProps {
  walletAddress?: string;
  connectedChainId?: ChainId;
  isConnected: boolean;
  onConnectWallet?: () => void;
  onSwitchChain?: (chainId: ChainId) => void;
  onMintSuccess?: (txHash: string, quantity: number) => void;
}

export default function MintPanel({
  walletAddress,
  connectedChainId,
  isConnected,
  onConnectWallet,
  onSwitchChain,
  onMintSuccess,
}: MintPanelProps) {
  const [selectedChain, setSelectedChain] = useState<ChainId>(DEFAULT_CHAINS[0]);
  const [quantity, setQuantity] = useState(1);
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState<string>();
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountType, setDiscountType] = useState<string | null>(null);

  const chainConfig = getChainConfig(selectedChain);
  const minting = useMintingFlow({
    walletAddress,
    selectedChainId: selectedChain,
    connectedChainId,
  });

  const handleChainChange = (chainId: ChainId) => {
    setSelectedChain(chainId);
    setMintError(undefined);

    // Auto-switch wallet if connected
    if (isConnected && connectedChainId !== chainId) {
      onSwitchChain?.(chainId);
    }
  };

  const handleRequestSignature = async () => {
    try {
      setMintError(undefined);
      await minting.requestSignature(quantity);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to request signature";
      setMintError(errorMessage);
    }
  };

  const handleMint = async () => {
    if (!isConnected) {
      setMintError("Please connect your wallet first");
      return;
    }

    if (!minting.signature) {
      setMintError("Please request a signature first");
      return;
    }

    if (!minting.isSignatureValid()) {
      setMintError("Signature has expired. Please request a new one.");
      return;
    }

    if (minting.isChainMismatch) {
      setMintError("Please switch to the correct network");
      return;
    }

    setIsMinting(true);
    setMintError(undefined);

    try {
      // In a real implementation, this would call the smart contract
      // For now, we'll simulate the mint process
      console.log("Minting:", {
        quantity,
        chainId: selectedChain,
        signature: minting.signature,
        nonce: minting.nonce,
        promoCode,
      });

      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Record the mint
      const mockTxHash = "0x" + Math.random().toString(16).slice(2);
      const gasPrice = chainConfig.gasSettings?.gasPrice || "20000000000";
      await minting.recordMint(
        quantity,
        mockTxHash,
        gasPrice,
        (BigInt(gasPrice) * BigInt(quantity)).toString()
      );

      onMintSuccess?.(mockTxHash, quantity);
      setQuantity(1);
      setPromoCode(null);
      setDiscountPercent(0);
      setDiscountType(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Mint failed";
      setMintError(errorMessage);
    } finally {
      setIsMinting(false);
    }
  };

  const canMint = isConnected && !minting.isChainMismatch && minting.isSignatureValid();

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 p-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl">Mint NFT</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Select a network and mint your NFT with signature-based whitelisting
          </p>
        </CardHeader>
      </Card>

      {/* Wallet Status */}
      <WalletStatusDisplay
        walletAddress={walletAddress}
        connectedChainId={connectedChainId}
        selectedChainId={selectedChain}
        isConnected={isConnected}
        onConnectWallet={onConnectWallet}
        onSwitchChain={handleChainChange}
      />

      {/* Chain Selector */}
      <ChainSelector
        selectedChain={selectedChain}
        onChainChange={handleChainChange}
        availableChains={DEFAULT_CHAINS}
      />

      {/* Mint Price */}
      <DynamicMintPrice
        selectedChain={selectedChain}
        mintPrice={chainConfig.gasSettings?.gasPrice || "0.01"}
        quantity={quantity}
      />

      {/* Supply Indicators */}
      <SupplyIndicators
        totalSupply={10000}
        currentSupply={4250}
        maxPerWallet={5}
        userMintedCount={2}
      />

      {/* Promo Code Input */}
      <PromoCodeInput
        walletAddress={walletAddress}
        onPromoCodeChange={(code, discount, type) => {
          setPromoCode(code);
          setDiscountPercent(discount);
          setDiscountType(type || null);
        }}
        disabled={isMinting}
      />

      {/* Signature Status */}
      <SignatureStatusIndicator
        status={minting.signatureStatus}
        expiryTime={minting.expiryTime}
      />

      {/* Discount Preview */}
      {promoCode && (discountPercent > 0 || discountType === "lifetime_free" || discountType === "one_time_free") && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-green-600">✨ Promo Applied: {promoCode}</p>
              {discountType === "discount_percent" && discountPercent > 0 && (
                <p className="text-xs text-green-600">
                  You save {discountPercent}% on each NFT
                </p>
              )}
              {discountType === "lifetime_free" && (
                <p className="text-xs text-green-600">Lifetime free minting unlocked!</p>
              )}
              {discountType === "one_time_free" && (
                <p className="text-xs text-green-600">One-time free mint available!</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quantity Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Quantity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || isMinting}
            >
              −
            </Button>
            <Input
              type="number"
              min="1"
              max="10"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isMinting}
              className="text-center"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              disabled={quantity >= 10 || isMinting}
            >
              +
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {mintError && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-4 flex gap-2">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{mintError}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!minting.signature ? (
          <Button
            onClick={handleRequestSignature}
            disabled={!isConnected || minting.isChainMismatch || minting.isLoading}
            className="flex-1"
            size="lg"
          >
            {minting.isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Requesting Signature...
              </>
            ) : (
              "Request Signature"
            )}
          </Button>
        ) : (
          <Button
            onClick={handleMint}
            disabled={!canMint || isMinting}
            className="flex-1"
            size="lg"
            variant={canMint ? "default" : "secondary"}
          >
            {isMinting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Minting...
              </>
            ) : (
              `Mint ${quantity} NFT${quantity !== 1 ? "s" : ""}`
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
