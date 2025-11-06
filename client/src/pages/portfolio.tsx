import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Wallet, TrendingUp, Plus, Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SavingsPot, UserSettings } from "@shared/schema";

const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

// Helper function to format currency.
// In a real application, this would be more sophisticated,
// handling different locales and currency formats.
const formatCurrency = (amount: number | string): string => {
  const num = parseFloat(amount.toString());
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Helper function to get currency symbol or code
const getCurrencyDisplay = (currency: string): { symbol: string; code: string } => {
  const currencyMap: Record<string, { symbol: string; code: string }> = {
    USD: { symbol: "$", code: "USD" },
    EUR: { symbol: "€", code: "EUR" },
    GBP: { symbol: "£", code: "GBP" },
    JPY: { symbol: "¥", code: "JPY" },
    CAD: { symbol: "C$", code: "CAD" },
    AUD: { symbol: "A$", code: "AUD" },
    CHF: { symbol: "CHF", code: "CHF" }, // Example: Swiss Franc, no standard symbol character
    RON: { symbol: "RON", code: "RON" }, // Example: Romanian Leu
    // Add more currencies as needed
  };
  return currencyMap[currency] || { symbol: currency, code: currency }; // Fallback to currency code if not found
};

export default function Portfolio() {
  const [addSavingsDialogOpen, setAddSavingsDialogOpen] = useState(false);
  const [addInvestmentsDialogOpen, setAddInvestmentsDialogOpen] = useState(false);
  const [editPotDialogOpen, setEditPotDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [potToDelete, setPotToDelete] = useState<{ id: string; name: string } | null>(null);
  const [newPotName, setNewPotName] = useState("");
  const [selectedPotId, setSelectedPotId] = useState<string>("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [editingPot, setEditingPot] = useState<any>(null);
  const [editAmount, setEditAmount] = useState("");
  const [currentType, setCurrentType] = useState<"savings" | "investments">("savings");
  const [isStartingAmount, setIsStartingAmount] = useState(false);
  const { toast } = useToast();

  const { data: savingsPots = [], isLoading: savingsLoading } = useQuery<SavingsPot[]>({
    queryKey: ["/api/savings-pots", { type: "savings" }],
  });

  const { data: investmentPots = [], isLoading: investmentsLoading } = useQuery<SavingsPot[]>({
    queryKey: ["/api/savings-pots", { type: "investments" }],
  });

  const { data: settings } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
  });

  const currencyInfo = getCurrencyDisplay(settings?.currency || "USD");
  const currencySymbol = currencyInfo.symbol;
  const currencyCode = currencyInfo.code; // Use currencyCode for display when symbol is not appropriate
  const showSymbolAfter = !["$", "€", "£", "¥"].includes(currencySymbol); // Determine if symbol should be shown after

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

  const updateMonthlyDataMutation = useMutation({
    mutationFn: ({ monthYear, data }: { monthYear: string; data: any }) =>
      apiRequest("PUT", `/api/monthly-data/${monthYear}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data"], exact: false });
    },
  });

  const totalSavings = savingsPots.reduce((sum: number, pot: any) => sum + parseFloat(pot.amount), 0);
  const totalInvestments = investmentPots.reduce((sum: number, pot: any) => sum + parseFloat(pot.amount), 0);
  const totalValue = totalSavings + totalInvestments;
  // Placeholder for totalGainLoss, assuming it would be calculated elsewhere or fetched
  const totalGainLoss = 0; 

  const handleOpenDialog = (type: "savings" | "investments") => {
    setCurrentType(type);
    setSelectedPotId("");
    setNewPotName("");
    setAdjustAmount("");
    setIsStartingAmount(false);
    if (type === "savings") {
      setAddSavingsDialogOpen(true);
    } else {
      setAddInvestmentsDialogOpen(true);
    }
  };

  const handleAddAmount = async () => {
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    const currentMonth = new Date().toISOString().substring(0, 7);

    try {
      if (selectedPotId && selectedPotId !== "new") {
        // Update existing pot
        const pot = (currentType === "savings" ? savingsPots : investmentPots).find(
          (p: any) => p.id === selectedPotId
        );
        if (pot) {
          const newAmount = (parseFloat(pot.amount) + amount).toString();
          await updatePotMutation.mutateAsync({
            id: selectedPotId,
            data: { amount: newAmount },
          });
        }
      } else if (selectedPotId === "new" && newPotName.trim()) {
        // Create new pot
        await createPotMutation.mutateAsync({
          name: newPotName,
          amount: amount.toString(),
          type: currentType,
        });
      } else {
        toast({ title: "Please select a pot or enter a name for new pot", variant: "destructive" });
        return;
      }

      // Calculate new totals after mutation completes
      await queryClient.invalidateQueries({ queryKey: ["/api/savings-pots"] });

      // Wait a bit for queries to refetch
      await new Promise(resolve => setTimeout(resolve, 100));

      // Only update monthly data if this is NOT a starting amount for a new pot
      // or if this is adding to an existing pot
      const shouldUpdateMonthlyData = selectedPotId !== "new" || !isStartingAmount;

      if (shouldUpdateMonthlyData) {
        // Get current monthly data to calculate the delta
        const currentMonthlyDataResponse = await fetch(`/api/monthly-data/${currentMonth}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        const currentMonthlyData = await currentMonthlyDataResponse.json();

        const currentMonthlySavings = parseFloat(currentMonthlyData?.savings || "0");
        const currentMonthlyInvestments = parseFloat(currentMonthlyData?.investments || "0");

        // Add the contribution amount to the current monthly data
        const newMonthlySavings = currentType === "savings" 
          ? currentMonthlySavings + amount 
          : currentMonthlySavings;
        const newMonthlyInvestments = currentType === "investments" 
          ? currentMonthlyInvestments + amount 
          : currentMonthlyInvestments;

        // Update monthly data with the incremented values
        await updateMonthlyDataMutation.mutateAsync({
          monthYear: currentMonth,
          data: {
            savings: newMonthlySavings.toString(),
            investments: newMonthlyInvestments.toString(),
          },
        });
      }

      toast({ title: `${currentType === "savings" ? "Savings" : "Investment"} updated successfully` });
      setAddSavingsDialogOpen(false);
      setAddInvestmentsDialogOpen(false);
      setSelectedPotId("");
      setNewPotName("");
      setAdjustAmount("");
    } catch (error: any) {
      toast({ title: "Error updating pot", description: error.message, variant: "destructive" });
    }
  };

  const handleDeletePot = (id: string, name: string) => {
    setPotToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (potToDelete) {
      deletePotMutation.mutate(potToDelete.id);
      setDeleteDialogOpen(false);
      setPotToDelete(null);
    }
  };

  const handleOpenEditDialog = (pot: any) => {
    setEditingPot(pot);
    setEditAmount(pot.amount);
    setEditPotDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    if (editingPot) {
      await updatePotMutation.mutateAsync({
        id: editingPot.id,
        data: { amount: amount.toString() },
      });
      setEditPotDialogOpen(false);
      setEditingPot(null);
      setEditAmount("");
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
          {showSymbolAfter ? `${formatCurrency(totalValue)} ${currencyCode}` : `${currencySymbol}${formatCurrency(totalValue)}`}
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
                  {showSymbolAfter ? `${formatCurrency(totalSavings)} ${currencyCode}` : `${currencySymbol}${formatCurrency(totalSavings)}`}
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
                        {showSymbolAfter ? `${formatCurrency(pot.amount)} ${currencyCode}` : `${currencySymbol}${formatCurrency(pot.amount)}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditDialog(pot)}
                        data-testid={`button-edit-pot-${pot.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePot(pot.id, pot.name)}
                        data-testid={`button-delete-pot-${pot.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
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
                  {showSymbolAfter ? `${formatCurrency(totalInvestments)} ${currencyCode}` : `${currencySymbol}${formatCurrency(totalInvestments)}`}
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
                        {showSymbolAfter ? `${formatCurrency(pot.amount)} ${currencyCode}` : `${currencySymbol}${formatCurrency(pot.amount)}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditDialog(pot)}
                        data-testid={`button-edit-pot-${pot.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePot(pot.id, pot.name)}
                        data-testid={`button-delete-pot-${pot.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
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
                      {pot.name} ({showSymbolAfter ? `${formatCurrency(pot.amount)} ${currencyCode}` : `${currencySymbol}${formatCurrency(pot.amount)}`})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPotId === "new" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new-pot-name">Pot Name</Label>
                  <Input
                    id="new-pot-name"
                    placeholder="e.g., Emergency Fund"
                    value={newPotName}
                    onChange={(e) => setNewPotName(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="starting-amount-savings"
                    checked={isStartingAmount}
                    onCheckedChange={(checked) => setIsStartingAmount(checked as boolean)}
                    data-testid="checkbox-starting-amount"
                  />
                  <Label
                    htmlFor="starting-amount-savings"
                    className="text-sm font-normal cursor-pointer leading-tight"
                  >
                    This is a starting amount (won't count toward this month's savings)
                  </Label>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({showSymbolAfter ? currencyCode : currencySymbol})</Label>
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
                    {showSymbolAfter ? `${amount} ${currencyCode}` : `${currencySymbol}${amount}`}
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
                      {pot.name} ({showSymbolAfter ? `${formatCurrency(pot.amount)} ${currencyCode}` : `${currencySymbol}${formatCurrency(pot.amount)}`})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPotId === "new" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new-investment-pot-name">Investment Name</Label>
                  <Input
                    id="new-investment-pot-name"
                    placeholder="e.g., Stocks Portfolio"
                    value={newPotName}
                    onChange={(e) => setNewPotName(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="starting-amount-investments"
                    checked={isStartingAmount}
                    onCheckedChange={(checked) => setIsStartingAmount(checked as boolean)}
                    data-testid="checkbox-starting-amount"
                  />
                  <Label
                    htmlFor="starting-amount-investments"
                    className="text-sm font-normal cursor-pointer leading-tight"
                  >
                    This is a starting amount (won't count toward this month's investments)
                  </Label>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="investment-amount">Amount ({showSymbolAfter ? currencyCode : currencySymbol})</Label>
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
                    {showSymbolAfter ? `${amount} ${currencyCode}` : `${currencySymbol}${amount}`}
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

      {/* Edit Pot Dialog */}
      <Dialog open={editPotDialogOpen} onOpenChange={setEditPotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingPot?.name}</DialogTitle>
            <DialogDescription>
              Manually set the total amount for this {editingPot?.type === 'savings' ? 'savings pot' : 'investment'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Total Amount ({showSymbolAfter ? currencyCode : currencySymbol})</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="text-right tabular-nums"
                data-testid="input-edit-amount"
              />
              <p className="text-xs text-muted-foreground">
                This will set the total amount to the value you enter above
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditPotDialogOpen(false)}
              className="flex-1"
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updatePotMutation.isPending}
              className="flex-1"
              data-testid="button-save-edit"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) setPotToDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {potToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this pot and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}