
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, TrendingUp, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function Portfolio() {
  const [addSavingsDialogOpen, setAddSavingsDialogOpen] = useState(false);
  const [addInvestmentsDialogOpen, setAddInvestmentsDialogOpen] = useState(false);
  const [newPotName, setNewPotName] = useState("");
  const [selectedPotId, setSelectedPotId] = useState<string>("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [currentType, setCurrentType] = useState<"savings" | "investments">("savings");
  const { toast } = useToast();

  const { data: savingsPots = [], isLoading: savingsLoading } = useQuery({
    queryKey: ["/api/savings-pots", { type: "savings" }],
  });

  const { data: investmentPots = [], isLoading: investmentsLoading } = useQuery({
    queryKey: ["/api/savings-pots", { type: "investments" }],
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CAD: "C$",
      AUD: "A$",
    };
    return symbols[currency] || "$";
  };

  const currencySymbol = getCurrencySymbol(settings?.currency || "USD");

  const createPotMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/savings-pots", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-pots"] });
      toast({ title: "Pot created successfully" });
    },
  });

  const updatePotMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PUT", `/api/savings-pots/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-pots"] });
      toast({ title: "Amount added successfully" });
    },
  });

  const deletePotMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/savings-pots/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-pots"] });
      toast({ title: "Pot deleted successfully" });
    },
  });

  const totalSavings = savingsPots.reduce((sum: number, pot: any) => sum + parseFloat(pot.amount), 0);
  const totalInvestments = investmentPots.reduce((sum: number, pot: any) => sum + parseFloat(pot.amount), 0);

  const handleOpenDialog = (type: "savings" | "investments") => {
    setCurrentType(type);
    setSelectedPotId("");
    setNewPotName("");
    setAdjustAmount("");
    if (type === "savings") {
      setAddSavingsDialogOpen(true);
    } else {
      setAddInvestmentsDialogOpen(true);
    }
  };

  const handleAddAmount = () => {
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    if (selectedPotId === "new") {
      if (!newPotName.trim()) {
        toast({ title: "Please enter a pot name", variant: "destructive" });
        return;
      }
      createPotMutation.mutate({
        name: newPotName,
        amount: amount.toString(),
        type: currentType,
      });
    } else if (selectedPotId) {
      const pots = currentType === "savings" ? savingsPots : investmentPots;
      const pot = pots.find((p: any) => p.id === selectedPotId);
      if (pot) {
        const newAmount = parseFloat(pot.amount) + amount;
        updatePotMutation.mutate({
          id: selectedPotId,
          data: { amount: newAmount.toString() },
        });
      }
    } else {
      toast({ title: "Please select or create a pot", variant: "destructive" });
      return;
    }

    setAddSavingsDialogOpen(false);
    setAddInvestmentsDialogOpen(false);
    setSelectedPotId("");
    setNewPotName("");
    setAdjustAmount("");
  };

  const handleDeletePot = (id: string) => {
    if (confirm("Are you sure you want to delete this pot?")) {
      deletePotMutation.mutate(id);
    }
  };

  const quickAdjustments = [100, 500, 1000];

  const isLoading = savingsLoading || investmentsLoading;

  if (isLoading) {
    return (
      <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6">
        <div className="h-12 bg-card rounded-lg animate-pulse" />
        <div className="h-32 bg-card rounded-lg animate-pulse" />
        <div className="h-64 bg-card rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Portfolio</h1>
        <p className="text-sm text-muted-foreground">Manage your savings and investments</p>
      </div>

      {/* Total Portfolio */}
      <Card className="p-6">
        <p className="text-sm text-muted-foreground mb-2">Total Portfolio Value</p>
        <p className="text-4xl font-bold tabular-nums" data-testid="text-total-portfolio">
          {currencySymbol}{" "}
          {(totalSavings + totalInvestments).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                <p className="text-sm text-muted-foreground mb-2">Total Savings</p>
                <p className="text-3xl font-bold tabular-nums" data-testid="text-savings-value">
                  {currencySymbol}{" "}
                  {totalSavings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <Button
                onClick={() => handleOpenDialog("savings")}
                data-testid="button-add-savings"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="space-y-3">
              {savingsPots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No savings pots yet. Create one to start saving!
                </p>
              ) : (
                savingsPots.map((pot: any) => (
                  <div key={pot.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{pot.name}</p>
                      <p className="text-lg font-semibold tabular-nums">
                        {currencySymbol}{parseFloat(pot.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePot(pot.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4 mt-6">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Investments</p>
                <p className="text-3xl font-bold tabular-nums" data-testid="text-investments-value">
                  {currencySymbol}{" "}
                  {totalInvestments.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <Button
                onClick={() => handleOpenDialog("investments")}
                data-testid="button-add-investments"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="space-y-3">
              {investmentPots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No investments yet. Create one to start investing!
                </p>
              ) : (
                investmentPots.map((pot: any) => (
                  <div key={pot.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{pot.name}</p>
                      <p className="text-lg font-semibold tabular-nums">
                        {currencySymbol}{parseFloat(pot.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePot(pot.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add to Savings Dialog */}
      <Dialog open={addSavingsDialogOpen} onOpenChange={setAddSavingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Savings</DialogTitle>
            <DialogDescription>
              Add money to an existing pot or create a new one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="savings-pot">Select Pot</Label>
              <Select value={selectedPotId} onValueChange={setSelectedPotId}>
                <SelectTrigger id="savings-pot">
                  <SelectValue placeholder="Choose a pot or create new" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">+ Create New Pot</SelectItem>
                  {savingsPots.map((pot: any) => (
                    <SelectItem key={pot.id} value={pot.id}>
                      {pot.name} ({currencySymbol}{parseFloat(pot.amount).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPotId === "new" && (
              <div className="space-y-2">
                <Label htmlFor="new-pot-name">Pot Name</Label>
                <Input
                  id="new-pot-name"
                  placeholder="e.g., Emergency Fund"
                  value={newPotName}
                  onChange={(e) => setNewPotName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({currencySymbol})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="text-right tabular-nums"
              />
            </div>

            <div className="space-y-2">
              <Label>Quick Add</Label>
              <div className="grid grid-cols-3 gap-2">
                {quickAdjustments.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setAdjustAmount(amount.toString())}
                  >
                    {currencySymbol}{amount}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setAddSavingsDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddAmount}
              disabled={createPotMutation.isPending || updatePotMutation.isPending}
              className="flex-1"
            >
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add to Investments Dialog */}
      <Dialog open={addInvestmentsDialogOpen} onOpenChange={setAddInvestmentsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Investments</DialogTitle>
            <DialogDescription>
              Add money to an existing investment or create a new one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="investments-pot">Choose Investment</Label>
              <Select value={selectedPotId} onValueChange={setSelectedPotId}>
                <SelectTrigger id="investments-pot">
                  <SelectValue placeholder="Choose an investment or create new" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">+ Create New Investment</SelectItem>
                  {investmentPots.map((pot: any) => (
                    <SelectItem key={pot.id} value={pot.id}>
                      {pot.name} ({currencySymbol}{parseFloat(pot.amount).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPotId === "new" && (
              <div className="space-y-2">
                <Label htmlFor="new-investment-pot-name">Investment Name</Label>
                <Input
                  id="new-investment-pot-name"
                  placeholder="e.g., Stocks Portfolio"
                  value={newPotName}
                  onChange={(e) => setNewPotName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="investment-amount">Amount ({currencySymbol})</Label>
              <Input
                id="investment-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="text-right tabular-nums"
              />
            </div>

            <div className="space-y-2">
              <Label>Quick Add</Label>
              <div className="grid grid-cols-3 gap-2">
                {quickAdjustments.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setAdjustAmount(amount.toString())}
                  >
                    {currencySymbol}{amount}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setAddInvestmentsDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddAmount}
              disabled={createPotMutation.isPending || updatePotMutation.isPending}
              className="flex-1"
            >
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
