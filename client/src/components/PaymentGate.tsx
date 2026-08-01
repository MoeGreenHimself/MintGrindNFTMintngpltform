import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import type { ChainId } from "@shared/chainConfig";

interface PaymentGateProps {
  chainId: ChainId;
  walletAddress: string;
  onPaymentComplete: (paymentId: string) => void;
  isAffiliateBypass?: boolean;
  platformFeeUSD?: number;
}

export default function PaymentGate({
  chainId,
  walletAddress,
  onPaymentComplete,
  isAffiliateBypass = false,
  platformFeeUSD = 2.99,
}: PaymentGateProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [costs, setCosts] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"crypto" | "card">("crypto");

  // Fetch pricing information
  const { data: pricingData, isLoading: pricingLoading } = trpc.pricing.calculateCosts.useQuery(
    { chainId, platformFeeUSD },
    { enabled: !isAffiliateBypass }
  );

  useEffect(() => {
    if (pricingData) {
      setCosts(pricingData);
      setIsLoading(false);
    }
  }, [pricingData]);

  // Affiliate bypass - no payment needed
  if (isAffiliateBypass) {
    return (
      <div className="border border-emerald-600/30 rounded-lg p-6 bg-emerald-950/10 space-y-4">
        <h3 className="text-lg font-bold text-emerald-300 tracking-wider">
          ⚡ AFFILIATE ACCESS
        </h3>
        <p className="text-sm text-emerald-300/70">
          You have affiliate access. Minting is free for you.
        </p>
        <Button
          onClick={() => onPaymentComplete("affiliate-bypass")}
          className="w-full bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-black font-bold py-3 rounded font-mono tracking-wider"
        >
          ▶ PROCEED TO MINT
        </Button>
      </div>
    );
  }

  if (isLoading || pricingLoading) {
    return (
      <div className="border border-emerald-600/30 rounded-lg p-6 bg-emerald-950/10 space-y-4">
        <h3 className="text-lg font-bold text-emerald-300 tracking-wider">
          ⚡ CALCULATING COSTS...
        </h3>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-emerald-600/20 rounded w-3/4"></div>
          <div className="h-4 bg-emerald-600/20 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !costs) {
    return (
      <div className="border border-red-600/30 rounded-lg p-6 bg-red-950/10 space-y-4">
        <h3 className="text-lg font-bold text-red-300 tracking-wider">
          ✗ ERROR CALCULATING COSTS
        </h3>
        <p className="text-sm text-red-300/70">{error || "Unable to fetch pricing information"}</p>
      </div>
    );
  }

  return (
    <div className="border border-emerald-600/30 rounded-lg p-6 bg-emerald-950/10 space-y-4">
      <h3 className="text-lg font-bold text-emerald-300 tracking-wider">
        ⚡ PAYMENT REQUIRED
      </h3>

      {/* Cost Breakdown */}
      <div className="bg-black/50 rounded p-4 space-y-2 text-sm">
        <div className="flex justify-between text-emerald-300/70">
          <span>Platform Fee:</span>
          <span className="text-emerald-300">${costs.breakdown.mintingFeeUSD.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-emerald-300/70">
          <span>Gas Estimate:</span>
          <span className="text-emerald-300">${costs.breakdown.gasCostUSD.toFixed(2)}</span>
        </div>
        <div className="border-t border-emerald-600/30 pt-2 flex justify-between font-bold">
          <span className="text-emerald-400">Total Cost:</span>
          <span className="text-amber-400">${costs.breakdown.totalUSD.toFixed(2)}</span>
        </div>
      </div>

      {/* Gas Details */}
      <div className="text-xs text-emerald-300/50 space-y-1">
        <p>Gas Limit: {costs.gasLimit} units</p>
        <p>Gas Price: {costs.gasPrice} gwei</p>
        <p>Estimated Gas Cost: {costs.gasCost} {chainId === 137 ? "MATIC" : "ETH"}</p>
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-2">
        <label className="text-xs text-emerald-400/70 font-mono">PAYMENT METHOD</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPaymentMethod("crypto")}
            className={`p-2 rounded border text-sm font-mono transition-all ${
              paymentMethod === "crypto"
                ? "border-emerald-500 bg-emerald-950/20 text-emerald-300"
                : "border-emerald-600/30 bg-black/50 text-emerald-300/50 hover:border-emerald-500/50"
            }`}
          >
            Crypto
          </button>
          <button
            onClick={() => setPaymentMethod("card")}
            className={`p-2 rounded border text-sm font-mono transition-all ${
              paymentMethod === "card"
                ? "border-emerald-500 bg-emerald-950/20 text-emerald-300"
                : "border-emerald-600/30 bg-black/50 text-emerald-300/50 hover:border-emerald-500/50"
            }`}
          >
            Card (Coming Soon)
          </button>
        </div>
      </div>

      {/* Warning about gas costs */}
      <div className="bg-amber-950/20 border border-amber-600/30 rounded p-3 text-xs text-amber-300">
        <p className="font-bold mb-1">⚠ GAS COST WARNING</p>
        <p>
          The gas estimate shown is approximate. Actual gas costs may vary based on network conditions.
          Make sure your wallet has sufficient funds to cover the total cost.
        </p>
      </div>

      {/* Payment Button */}
      <Button
        onClick={() => {
          if (paymentMethod === "crypto") {
            // Generate payment ID and proceed
            const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            onPaymentComplete(paymentId);
          } else {
            alert("Card payments coming soon!");
          }
        }}
        className="w-full bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-black font-bold py-3 rounded font-mono tracking-wider disabled:opacity-50"
        disabled={paymentMethod !== "crypto"}
      >
        {paymentMethod === "crypto"
          ? `▶ PAY $${costs.breakdown.totalUSD.toFixed(2)} & MINT`
          : "▶ CARD PAYMENTS COMING SOON"}
      </Button>

      {/* Wallet Address Display */}
      <div className="text-xs text-emerald-300/50 text-center">
        Funds will be sent from: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
      </div>
    </div>
  );
}
