import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SupplyIndicatorsProps {
  totalSupply: number;
  currentSupply: number;
  maxPerWallet: number;
  userMintedCount: number;
}

export default function SupplyIndicators({
  totalSupply,
  currentSupply,
  maxPerWallet,
  userMintedCount,
}: SupplyIndicatorsProps) {
  const remainingSupply = totalSupply - currentSupply;
  const remainingForWallet = maxPerWallet - userMintedCount;
  const supplyPercentage = (currentSupply / totalSupply) * 100;
  const walletPercentage = (userMintedCount / maxPerWallet) * 100;

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Supply Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Supply */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Supply:</span>
            <span className="text-sm font-semibold text-foreground">
              {currentSupply} / {totalSupply}
            </span>
          </div>
          <Progress value={supplyPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {remainingSupply} NFTs remaining
          </p>
        </div>

        {/* Per-Wallet Limit */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Your Mints:</span>
            <span className="text-sm font-semibold text-foreground">
              {userMintedCount} / {maxPerWallet}
            </span>
          </div>
          <Progress 
            value={walletPercentage} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            {remainingForWallet > 0 
              ? `You can mint ${remainingForWallet} more NFT${remainingForWallet !== 1 ? 's' : ''}`
              : 'You have reached your minting limit'
            }
          </p>
        </div>

        {/* Status Indicator */}
        <div className="pt-2 border-t border-border/50">
          {remainingSupply === 0 ? (
            <div className="text-xs font-medium text-destructive">
              ⚠️ Collection Sold Out
            </div>
          ) : remainingForWallet === 0 ? (
            <div className="text-xs font-medium text-amber-600">
              ⚠️ Wallet Limit Reached
            </div>
          ) : (
            <div className="text-xs font-medium text-green-600">
              ✓ Ready to Mint
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
