import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface PromoCodeInputProps {
  walletAddress?: string;
  onPromoCodeChange?: (code: string | null, discount: number, type?: string | null) => void;
  disabled?: boolean;
}

export default function PromoCodeInput({
  walletAddress,
  onPromoCodeChange,
  disabled = false,
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState("");
  const [validationState, setValidationState] = useState<"idle" | "loading" | "valid" | "invalid">(
    "idle"
  );
  const [validationMessage, setValidationMessage] = useState("");
  const [discountInfo, setDiscountInfo] = useState<{
    type: string | null;
    discount: number;
    description?: string | undefined;
  }>({
    type: null,
    discount: 0,
  });

  const validatePromoCodeMutation = trpc.mint.validatePromoCode.useQuery(
    {
      code: promoCode.toUpperCase(),
      walletAddress: walletAddress || "0x0000000000000000000000000000000000000000",
    },
    {
      enabled: promoCode.length > 0 && !!walletAddress,
      staleTime: 0,
      retry: false,
    }
  );

  // Handle validation response
  useEffect(() => {
    if (!promoCode) {
      setValidationState("idle");
      setValidationMessage("");
      setDiscountInfo({ type: null, discount: 0 });
      onPromoCodeChange?.(null, 0);
      return;
    }

    if (validatePromoCodeMutation.isLoading) {
      setValidationState("loading");
      setValidationMessage("Validating code...");
      return;
    }

    if (validatePromoCodeMutation.data) {
      const data = validatePromoCodeMutation.data;

      if (data.valid) {
        setValidationState("valid");
        setDiscountInfo({
          type: data.type || null,
          discount: data.discount || 0,
          description: data.description || undefined,
        });

        // Format message based on type
        let message = "";
        if (data.type === "lifetime_free") {
          message = "✨ Lifetime free minting unlocked!";
        } else if (data.type === "one_time_free") {
          message = "🎉 One-time free mint available!";
        } else if (data.type === "discount_percent") {
          message = `💰 ${data.discount}% discount applied`;
        }
        setValidationMessage(message);
        onPromoCodeChange?.(promoCode.toUpperCase(), data.discount || 0, data.type as any);
      } else {
        setValidationState("invalid");
        setValidationMessage(data.reason || "Invalid promo code");
        setDiscountInfo({ type: null, discount: 0 });
        onPromoCodeChange?.(null, 0);
      }
    }
  }, [promoCode, validatePromoCodeMutation.data, validatePromoCodeMutation.isLoading, walletAddress, onPromoCodeChange]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    setPromoCode(value);
  };

  const handleClear = () => {
    setPromoCode("");
    setValidationState("idle");
    setValidationMessage("");
    setDiscountInfo({ type: null, discount: 0 });
    onPromoCodeChange?.(null, 0);
  };

  const getStatusIcon = () => {
    switch (validationState) {
      case "loading":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "valid":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "invalid":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (validationState) {
      case "valid":
        return "border-green-500/50 bg-green-500/5";
      case "invalid":
        return "border-red-500/50 bg-red-500/5";
      default:
        return "";
    }
  };

  const getMessageColor = () => {
    switch (validationState) {
      case "valid":
        return "text-green-600";
      case "invalid":
        return "text-red-600";
      case "loading":
        return "text-blue-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className={getStatusColor()}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Promo Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Input Field */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Enter promo code (e.g., GRINDWORK)"
              value={promoCode}
              onChange={handleInputChange}
              disabled={disabled}
              className="pr-10"
              maxLength={50}
            />
            {getStatusIcon() && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getStatusIcon()}
              </div>
            )}
          </div>
          {promoCode && (
            <button
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Validation Message */}
        {validationMessage && (
          <p className={`text-sm ${getMessageColor()}`}>
            {validationMessage}
          </p>
        )}

        {/* Discount Preview */}
        {validationState === "valid" && discountInfo.type && (
          <div className="pt-2 border-t border-border">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Discount Type:</span>
                <Badge variant="secondary" className="capitalize">
                  {discountInfo.type === "lifetime_free"
                    ? "Lifetime Free"
                    : discountInfo.type === "one_time_free"
                      ? "One-Time Free"
                      : `${discountInfo.discount}% Off`}
                </Badge>
              </div>

              {discountInfo.type === "discount_percent" && discountInfo.discount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">You Save:</span>
                  <span className="text-sm font-semibold text-green-600">
                    {discountInfo.discount}% on each NFT
                  </span>
                </div>
              )}

              {discountInfo.description && (
                <p className="text-xs text-muted-foreground italic">
                  {discountInfo.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Helper Text */}
        {!promoCode && (
          <p className="text-xs text-muted-foreground">
            Have a promo code? Enter it above to unlock special discounts and free mints!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
