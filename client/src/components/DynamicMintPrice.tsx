import { useMemo } from "react";
import { getChainConfig, getChainCurrency } from "@shared/chainConfig";
import type { ChainId } from "@shared/chainConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DynamicMintPriceProps {
  selectedChain: ChainId;
  mintPrice: string; // Price in wei
  quantity: number;
}

export default function DynamicMintPrice({ selectedChain, mintPrice, quantity }: DynamicMintPriceProps) {
  const chainConfig = getChainConfig(selectedChain);
  const currency = getChainCurrency(selectedChain);

  const priceInEther = useMemo(() => {
    try {
      const priceNum = BigInt(mintPrice);
      const oneEther = BigInt(10 ** 18);
      const result = Number(priceNum) / Number(oneEther);
      return result.toFixed(6);
    } catch {
      return "0";
    }
  }, [mintPrice]);

  const totalPrice = useMemo(() => {
    try {
      const priceNum = BigInt(mintPrice);
      const total = priceNum * BigInt(quantity);
      const oneEther = BigInt(10 ** 18);
      const result = Number(total) / Number(oneEther);
      return result.toFixed(6);
    } catch {
      return "0";
    }
  }, [mintPrice, quantity]);

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Mint Price ({chainConfig.name})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Price per NFT:</span>
          <span className="text-lg font-semibold text-foreground">
            {priceInEther} {currency}
          </span>
        </div>

        {quantity > 1 && (
          <>
            <div className="border-t border-border/50 pt-3" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Total ({quantity} NFTs):
              </span>
              <span className="text-xl font-bold text-primary">
                {totalPrice} {currency}
              </span>
            </div>
          </>
        )}

        <div className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
          <p>Network: <span className="font-medium">{chainConfig.name}</span></p>
          <p>Gas: {chainConfig.gasSettings?.gasLimit || "Standard"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
