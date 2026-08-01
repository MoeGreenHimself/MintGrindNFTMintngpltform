import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Edit2, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminDashboard() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    type: "discount_percent" as "lifetime_free" | "one_time_free" | "discount_percent",
    discountPercent: 0,
    maxUses: "",
    description: "",
  });

  // Fetch data
  const { data: promoCodesData, isLoading: isLoadingCodes, refetch: refetchCodes } =
    trpc.admin.getAllPromoCodesWithStats.useQuery();
  const { data: analyticsData, isLoading: isLoadingAnalytics } =
    trpc.admin.getAnalyticsSummary.useQuery();

  // Mutations
  const createCodeMutation = trpc.admin.createPromoCode.useMutation({
    onSuccess: () => {
      refetchCodes();
      setShowCreateForm(false);
      setFormData({
        code: "",
        type: "discount_percent",
        discountPercent: 0,
        maxUses: "",
        description: "",
      });
    },
  });

  const disableCodeMutation = trpc.admin.disablePromoCode.useMutation({
    onSuccess: () => {
      refetchCodes();
    },
  });

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCodeMutation.mutateAsync({
        code: formData.code.toUpperCase(),
        type: formData.type,
        discountPercent: formData.type === "discount_percent" ? formData.discountPercent : 0,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        description: formData.description || undefined,
      });
    } catch (error) {
      console.error("Failed to create promo code:", error);
    }
  };

  const handleDisableCode = async (promoCodeId: number) => {
    if (confirm("Are you sure you want to disable this promo code?")) {
      await disableCodeMutation.mutateAsync({ promoCodeId });
    }
  };

  const formatCurrency = (wei: string) => {
    const num = BigInt(wei);
    const eth = Number(num) / 1e18;
    return eth.toFixed(4);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage promo codes and view analytics</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          New Promo Code
        </Button>
      </div>

      {/* Analytics Summary */}
      {isLoadingAnalytics ? (
        <Card>
          <CardContent className="pt-6 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </CardContent>
        </Card>
      ) : analyticsData ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Promo Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalPromos}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analyticsData.activePromos} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Uses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalUsesAcrossAll}</div>
              <p className="text-xs text-muted-foreground mt-1">across all codes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analyticsData.totalSavingsAcrossAll)} ETH
              </div>
              <p className="text-xs text-muted-foreground mt-1">distributed to users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inactive Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.inactivePromos}</div>
              <p className="text-xs text-muted-foreground mt-1">disabled or expired</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Create Form */}
      {showCreateForm && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle>Create New Promo Code</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCode} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Code</label>
                  <Input
                    placeholder="e.g., GRINDWORK"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="discount_percent">Percentage Discount</option>
                    <option value="lifetime_free">Lifetime Free</option>
                    <option value="one_time_free">One-Time Free</option>
                  </select>
                </div>

                {formData.type === "discount_percent" && (
                  <div>
                    <label className="text-sm font-medium">Discount %</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discountPercent}
                      onChange={(e) =>
                        setFormData({ ...formData, discountPercent: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Max Uses (optional)</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Unlimited if empty"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="e.g., Special offer for early adopters"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={!formData.code || createCodeMutation.isPending}
                >
                  {createCodeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Code"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Promo Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Promo Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCodes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : promoCodesData && promoCodesData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Code</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Uses</th>
                    <th className="text-left py-3 px-4 font-medium">Savings</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodesData.map((code) => (
                    <tr key={code.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-sm">{code.code}</td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="capitalize">
                          {code.type === "lifetime_free"
                            ? "Lifetime Free"
                            : code.type === "one_time_free"
                              ? "One-Time Free"
                              : `${code.discountPercent}% Off`}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          {code.stats?.totalUses || 0}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {code.stats?.totalAmountSaved
                          ? `${formatCurrency(code.stats.totalAmountSaved)} ETH`
                          : "0 ETH"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={code.isActive ? "default" : "secondary"}>
                          {code.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={!code.isActive}
                            title="Edit (coming soon)"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDisableCode(code.id)}
                            disabled={!code.isActive || disableCodeMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No promo codes yet. Create one to get started!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
