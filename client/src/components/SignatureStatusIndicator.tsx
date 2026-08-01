import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Clock, XCircle, Loader2 } from "lucide-react";

export type SignatureStatus = "required" | "loading" | "valid" | "expired" | "invalid";

interface SignatureStatusIndicatorProps {
  status: SignatureStatus;
  expiryTime?: number; // Unix timestamp in seconds
}

export default function SignatureStatusIndicator({
  status,
  expiryTime,
}: SignatureStatusIndicatorProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case "required":
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          label: "Signature Required",
          description: "Whitelist signature needed to mint",
          color: "text-amber-600",
          bgColor: "bg-amber-50 dark:bg-amber-950",
          borderColor: "border-amber-200 dark:border-amber-800",
        };
      case "loading":
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          label: "Validating...",
          description: "Checking signature validity",
          color: "text-blue-600",
          bgColor: "bg-blue-50 dark:bg-blue-950",
          borderColor: "border-blue-200 dark:border-blue-800",
        };
      case "valid":
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          label: "Signature Valid",
          description: "You are whitelisted to mint",
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-950",
          borderColor: "border-green-200 dark:border-green-800",
        };
      case "expired":
        return {
          icon: <Clock className="w-4 h-4" />,
          label: "Signature Expired",
          description: "Your signature has expired. Request a new one.",
          color: "text-orange-600",
          bgColor: "bg-orange-50 dark:bg-orange-950",
          borderColor: "border-orange-200 dark:border-orange-800",
        };
      case "invalid":
        return {
          icon: <XCircle className="w-4 h-4" />,
          label: "Invalid Signature",
          description: "Signature validation failed. Not whitelisted.",
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/30",
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          label: "Unknown Status",
          description: "Unable to determine signature status",
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          borderColor: "border-border",
        };
    }
  };

  const display = getStatusDisplay();

  const formatExpiryTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  return (
    <Card className={`border ${display.borderColor} ${display.bgColor}`}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${display.color}`}>
            {display.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold text-sm ${display.color}`}>
                {display.label}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {display.description}
            </p>
            {expiryTime && status === "valid" && (
              <p className="text-xs text-muted-foreground mt-2">
                Expires: {formatExpiryTime(expiryTime)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
