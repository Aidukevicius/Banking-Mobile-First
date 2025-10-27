import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, TrendingUp, Pencil, Plus, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MonthSelector } from "@/components/month-selector";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export default function Portfolio() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [savingsDialogOpen, setSavingsDialogOpen] = useState(false);
  const [investmentsDialogOpen, setInvestmentsDialogOpen] = useState(false);
  const [editValue, setEditValue] = useState("");
  const { toast } = useToast();

  const { data: monthlyData, isLoading } = useQuery({
    queryKey: ["/api/monthly-data", selectedMonth],
  });

  const { data: allMonthlyData = [] } = useQuery({
    queryKey: ["/api/monthly-data"],
  });

  const updateMonthlyDataMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("PUT", `/api/monthly-data/${selectedMonth}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data"] });
      toast({ title: "Portfolio updated successfully" });
    },
  });

  const quickAdjustments = [100, 500, 1000];

  const currentSavings = monthlyData?.savings ? parseFloat(monthlyData.savings) : 0;
  const currentInvestments = monthlyData?.investments ? parseFloat(monthlyData.investments) : 0;

  const handleQuickAdjust = (amount: number, type: "add" | "subtract", field: "savings" | "investments") => {
    const currentValue = field === "savings" ? currentSavings : currentInvestments;
    const adjustment = type === "add" ? amount : -amount;
    const newValue = Math.max(0, currentValue + adjustment);
    
    updateMonthlyDataMutation.mutate({
      monthYear: selectedMonth,
      [field]: newValue.toString(),
    });
  };

  const handleSaveEdit = (isInvestments: boolean) => {
    const value = parseFloat(editValue);
    if (isNaN(value) || value < 0) return;

    updateMonthlyDataMutation.mutate({
      monthYear: selectedMonth,
      [isInvestments ? "investments" : "savings"]: value.toString(),
    });

    if (isInvestments) {
      setInvestmentsDialogOpen(false);
    } else {
      setSavingsDialogOpen(false);
    }
    setEditValue("");
  };

  const getHistory = (field: "savings" | "investments") => {
    return allMonthlyData
      .filter((data: any) => parseFloat(data[field]) > 0)
      .slice(0, 3)
      .map((data: any) => {
        const date = new Date(data.monthYear + "-01");
        const month = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        const amount = parseFloat(data[field]);
        return { month, amount, change: 0 };
      });
  };

  if (isLoading) {
    return (
      <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6">
        <div className="h-12 bg-card rounded-lg animate-pulse" />
        <div className="h-32 bg-card rounded-lg animate-pulse" />
        <div className="h-12 bg-card rounded-lg animate-pulse" />
        <div className="h-64 bg-card rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Portfolio</h1>
        <MonthSelector month={selectedMonth} onMonthChange={setSelectedMonth} />
      </div>

      {/* Total Portfolio */}
      <Card className="p-6">
        <p className="text-sm text-muted-foreground mb-2">Total Portfolio Value</p>
        <p className="text-4xl font-bold tabular-nums" data-testid="text-total-portfolio">
          ${(currentSavings + currentInvestments).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="savings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="savings" data-testid="tab-savings">
            <Wallet className="w-4 h-4 mr-2" />
            Savings
          </TabsTrigger>
          <TabsTrigger value="investments" data-testid="tab-investments">
            <TrendingUp className="w-4 h-4 mr-2" />
            Investments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="savings" className="space-y-4 mt-6">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Current Savings</p>
                <p className="text-3xl font-bold tabular-nums" data-testid="text-savings-value">
                  ${currentSavings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setEditValue(currentSavings.toString());
                  setSavingsDialogOpen(true);
                }}
                data-testid="button-edit-savings"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Quick Adjust</p>
              <div className="flex gap-2">
                {quickAdjustments.map((amount) => (
                  <div key={amount} className="flex-1 flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAdjust(amount, "subtract", "savings")}
                      className="flex-1"
                      data-testid={`button-subtract-${amount}`}
                      disabled={updateMonthlyDataMutation.isPending}
                    >
                      <Minus className="w-3 h-3 mr-1" />
                      ${amount}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAdjust(amount, "add", "savings")}
                      className="flex-1"
                      data-testid={`button-add-${amount}`}
                      disabled={updateMonthlyDataMutation.isPending}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      ${amount}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Savings History</h3>
            {getHistory("savings").length > 0 ? (
              <div className="space-y-3">
                {getHistory("savings").map((entry: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{entry.month}</span>
                    <p className="text-sm font-semibold tabular-nums">
                      ${entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No history available</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4 mt-6">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Current Investments</p>
                <p className="text-3xl font-bold tabular-nums" data-testid="text-investments-value">
                  ${currentInvestments.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setEditValue(currentInvestments.toString());
                  setInvestmentsDialogOpen(true);
                }}
                data-testid="button-edit-investments"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Quick Adjust</p>
              <div className="flex gap-2">
                {quickAdjustments.map((amount) => (
                  <div key={amount} className="flex-1 flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAdjust(amount, "subtract", "investments")}
                      className="flex-1"
                      disabled={updateMonthlyDataMutation.isPending}
                    >
                      <Minus className="w-3 h-3 mr-1" />
                      ${amount}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAdjust(amount, "add", "investments")}
                      className="flex-1"
                      disabled={updateMonthlyDataMutation.isPending}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      ${amount}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Investment History</h3>
            {getHistory("investments").length > 0 ? (
              <div className="space-y-3">
                {getHistory("investments").map((entry: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{entry.month}</span>
                    <p className="text-sm font-semibold tabular-nums">
                      ${entry.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No history available</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Savings Dialog */}
      <Dialog open={savingsDialogOpen} onOpenChange={setSavingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Savings</DialogTitle>
            <DialogDescription>
              Enter the new total savings amount for {selectedMonth}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="savings-value">Savings Amount</Label>
              <Input
                id="savings-value"
                type="number"
                placeholder="0.00"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-12 text-right text-2xl tabular-nums"
                data-testid="input-edit-savings"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSavingsDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSaveEdit(false)}
              disabled={!editValue || updateMonthlyDataMutation.isPending}
              className="flex-1"
              data-testid="button-save-savings"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Investments Dialog */}
      <Dialog open={investmentsDialogOpen} onOpenChange={setInvestmentsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Investments</DialogTitle>
            <DialogDescription>
              Enter the new total investment value for {selectedMonth}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="investments-value">Investment Value</Label>
              <Input
                id="investments-value"
                type="number"
                placeholder="0.00"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-12 text-right text-2xl tabular-nums"
                data-testid="input-edit-investments"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setInvestmentsDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSaveEdit(true)}
              disabled={!editValue || updateMonthlyDataMutation.isPending}
              className="flex-1"
              data-testid="button-save-investments"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
