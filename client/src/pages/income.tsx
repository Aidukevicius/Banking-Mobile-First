import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Plus, Briefcase, Wallet as WalletIcon, Edit2, Trash2 } from "lucide-react";
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
import { MonthSelector } from "@/components/month-selector";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { MonthlyData, Transaction, Category, UserSettings } from "@shared/schema";

const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export default function Income() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [addIncomeDialogOpen, setAddIncomeDialogOpen] = useState(false);
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [editedTransaction, setEditedTransaction] = useState<any>(null);
  const [newIncome, setNewIncome] = useState({
    date: new Date().toISOString().split('T')[0],
    description: "",
    amount: "",
    categoryId: "",
  });
  const { toast } = useToast();

  const { data: monthlyData } = useQuery<MonthlyData>({
    queryKey: ["/api/monthly-data", selectedMonth],
  });

  const { data: allTransactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", selectedMonth],
    queryFn: async () => {
      const data = await apiRequest("GET", `/api/transactions?month=${selectedMonth}`, undefined);
      return Array.isArray(data) ? data : [];
    },
  });

  const incomeTransactions = allTransactions.filter((t) => t.type === 'income');

  const { data: allCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Filter income categories
  const incomeCategories = allCategories.filter((cat) => cat.type === 'income');

  const { data: settings } = useQuery<UserSettings>({
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
      RON: "RON",
      CHF: "CHF",
      SEK: "SEK",
      NOK: "NOK",
    };
    return symbols[currency] || currency;
  };

  const currencySymbol = getCurrencySymbol(settings?.currency || "USD");
  const showSymbolAfter = ["RON", "CHF", "SEK", "NOK"].includes(settings?.currency || "USD");

  const createIncomeMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/transactions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data"] });
      setAddIncomeDialogOpen(false);
      setNewIncome({
        date: new Date().toISOString().split('T')[0],
        description: "",
        amount: "",
        categoryId: "",
      });
      toast({ title: "Income added successfully!" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category created successfully!" });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, categoryId }: { id: string; categoryId: string }) =>
      apiRequest("PUT", `/api/transactions/${id}`, { categoryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data"] });
      setEditCategoryDialogOpen(false);
      toast({
        title: "Category updated",
        description: "Income category has been updated successfully",
      });
    },
  });

  const updateTransactionDetailsMutation = useMutation({
    mutationFn: ({ id, amount, categoryId }: { id: string; amount: string; categoryId?: string }) =>
      apiRequest("PUT", `/api/transactions/${id}`, { amount, categoryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data"] });
      setEditDialogOpen(false);
      setEditedTransaction(null);
      toast({
        title: "Income updated",
        description: "Your changes have been saved successfully",
      });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/transactions/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data"] });
      setDeleteDialogOpen(false);
      toast({
        title: "Income deleted",
        description: "Income has been removed successfully",
      });
    },
  });

  const handleAddIncome = () => {
    if (!newIncome.amount || !newIncome.description || !newIncome.categoryId) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    createIncomeMutation.mutate({
      type: "income",
      date: newIncome.date,
      description: newIncome.description,
      provider: newIncome.description,
      amount: parseFloat(newIncome.amount).toString(),
      categoryId: newIncome.categoryId,
      monthYear: selectedMonth,
    });
  };

  const handleUpdateCategory = (categoryId: string) => {
    if (!selectedTransaction) return;
    updateTransactionMutation.mutate({
      id: selectedTransaction.id,
      categoryId,
    });
  };

  const handleEditTransaction = () => {
    if (!editedTransaction) return;
    updateTransactionDetailsMutation.mutate({
      id: editedTransaction.id,
      amount: editedTransaction.amount,
      categoryId: editedTransaction.categoryId,
    });
  };

  const handleDeleteTransaction = () => {
    if (!selectedTransaction) return;
    deleteTransactionMutation.mutate(selectedTransaction.id);
    setDeleteDialogOpen(false);
  };

  const createDefaultCategories = () => {
    const defaultIncomeCategories = [
      { name: "Salary", icon: "briefcase", color: "#10B981", type: "income" },
      { name: "Freelance", icon: "laptop", color: "#3B82F6", type: "income" },
      { name: "Investment Returns", icon: "trending-up", color: "#8B5CF6", type: "income" },
      { name: "Other Income", icon: "dollar-sign", color: "#F59E0B", type: "income" },
    ];

    defaultIncomeCategories.forEach(category => {
      createCategoryMutation.mutate(category);
    });
  };

  const totalIncome = parseFloat(monthlyData?.income || "0");

  const categoryBreakdown = incomeCategories.map((cat: any) => {
    const catTransactions = incomeTransactions.filter((t: any) => t.categoryId === cat.id);
    const total = catTransactions.reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0);
    return {
      id: cat.id,
      name: cat.name,
      amount: total,
      color: cat.color,
      count: catTransactions.length,
    };
  }).filter((cat: any) => cat.amount > 0);

  if (isLoading) {
    return (
      <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6">
        <div className="h-12 bg-card rounded-lg animate-pulse" />
        <div className="h-32 bg-card rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Income</h1>
        <MonthSelector month={selectedMonth} onMonthChange={setSelectedMonth} />
      </div>

      {/* Total Income Card */}
      <Card className="p-6">
        <p className="text-sm text-muted-foreground mb-2">Total Monthly Income</p>
        <p className="text-4xl font-bold tabular-nums mb-4 text-green-600 dark:text-green-400" data-testid="text-total-income">
          {showSymbolAfter 
            ? `${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`
            : `${currencySymbol}${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }
        </p>
        <Button
          onClick={() => setAddIncomeDialogOpen(true)}
          className="w-full"
          data-testid="button-add-income"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Income
        </Button>
      </Card>

      {incomeCategories.length === 0 && (
        <Card className="p-6">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">No income categories yet</p>
            <p className="text-sm text-muted-foreground">
              Use the Categories tab in the bottom navigation to create income categories
            </p>
          </div>
        </Card>
      )}

      {/* Income by Category */}
      {categoryBreakdown.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Income by Source</h3>
          <div className="space-y-3">
            {categoryBreakdown.map((category: any) => (
              <div key={category.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium">{category.name}</span>
                  <span className="text-xs text-muted-foreground">({category.count})</span>
                </div>
                <p className="text-sm font-semibold tabular-nums text-green-600 dark:text-green-400">
                  {showSymbolAfter 
                    ? `${category.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currencySymbol}`
                    : `${currencySymbol}${category.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                  }
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Income Transactions */}
      {incomeTransactions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Income</h3>
          <div className="space-y-3">
            {incomeTransactions.slice(0, 10).map((transaction: any) => {
              const category = allCategories.find((c: any) => c.id === transaction.categoryId);
              return (
                <div key={transaction.id} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()} • {category?.name || 'Uncategorized'}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-green-600 dark:text-green-400">
                    {showSymbolAfter 
                      ? `${Math.abs(parseFloat(transaction.amount)).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currencySymbol}`
                      : `${currencySymbol}${Math.abs(parseFloat(transaction.amount)).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                    }
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditedTransaction({
                          id: transaction.id,
                          amount: Math.abs(parseFloat(transaction.amount)).toString(),
                          categoryId: transaction.categoryId || "",
                        });
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Add Income Dialog */}
      <Dialog open={addIncomeDialogOpen} onOpenChange={setAddIncomeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Income</DialogTitle>
            <DialogDescription>
              Record a new income transaction for {selectedMonth}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="income-date">Date</Label>
              <Input
                id="income-date"
                type="date"
                value={newIncome.date}
                onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                data-testid="input-income-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-description">Description</Label>
              <Input
                id="income-description"
                placeholder="e.g., Wage"
                value={newIncome.description}
                onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
                data-testid="input-income-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-category">Category</Label>
              <Select
                value={newIncome.categoryId}
                onValueChange={(value) => setNewIncome({ ...newIncome, categoryId: value })}
              >
                <SelectTrigger id="income-category" data-testid="select-income-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {incomeCategories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-amount">Amount ({currencySymbol})</Label>
              <Input
                id="income-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newIncome.amount}
                onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                className="text-right tabular-nums"
                data-testid="input-income-amount"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setAddIncomeDialogOpen(false)}
              className="flex-1"
              data-testid="button-cancel-income"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddIncome}
              disabled={createIncomeMutation.isPending}
              className="flex-1"
              data-testid="button-save-income"
            >
              Add Income
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editCategoryDialogOpen} onOpenChange={setEditCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Income Category</DialogTitle>
            <DialogDescription>
              Choose a category for this income transaction.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction?.categoryId && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Current category:</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: allCategories.find((c: any) => c.id === selectedTransaction.categoryId)?.color }}
                />
                <span className="text-sm font-medium">
                  {allCategories.find((c: any) => c.id === selectedTransaction.categoryId)?.name}
                </span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 py-4">
            {incomeCategories.length === 0 ? (
              <p className="col-span-2 text-center text-muted-foreground py-4">
                No income categories yet. Create one in the Categories tab first.
              </p>
            ) : (
              incomeCategories.map((cat: any) => (
                <Button
                  key={cat.id}
                  variant={selectedTransaction?.categoryId === cat.id ? "default" : "outline"}
                  className="h-12"
                  onClick={() => handleUpdateCategory(cat.id)}
                  disabled={updateTransactionMutation.isPending}
                >
                  {cat.name}
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Income Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Income</DialogTitle>
            <DialogDescription>
              Update the amount and category for this income.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount ({currencySymbol})</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={editedTransaction?.amount || ""}
                onChange={(e) => setEditedTransaction({ ...editedTransaction, amount: e.target.value })}
                className="text-right tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={editedTransaction?.categoryId || ""}
                onValueChange={(value) => setEditedTransaction({ ...editedTransaction, categoryId: value })}
              >
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {incomeCategories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditTransaction}
              disabled={!editedTransaction?.amount || updateTransactionDetailsMutation.isPending}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Income</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this income? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Description:</span>
                <span className="text-sm">{selectedTransaction.description}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Amount:</span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {showSymbolAfter 
                    ? `+${Math.abs(parseFloat(selectedTransaction.amount)).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currencySymbol}`
                    : `+${currencySymbol}${Math.abs(parseFloat(selectedTransaction.amount)).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                  }
                </span>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTransaction}
              disabled={deleteTransactionMutation.isPending}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}