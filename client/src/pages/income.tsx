import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Plus, Briefcase, Wallet as WalletIcon } from "lucide-react";
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

const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export default function Income() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [addIncomeDialogOpen, setAddIncomeDialogOpen] = useState(false);
  const [newIncome, setNewIncome] = useState({
    date: new Date().toISOString().split('T')[0],
    description: "",
    amount: "",
    categoryId: "",
  });
  const { toast } = useToast();

  const { data: monthlyData } = useQuery({
    queryKey: [`/api/monthly-data/${selectedMonth}`],
  });

  const { data: incomeTransactions = [], isLoading } = useQuery({
    queryKey: ["/api/transactions", { month: selectedMonth }],
    select: (data: any[]) => data.filter((t: any) => t.type === 'income'),
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Filter income categories
  const incomeCategories = allCategories.filter((cat: any) => cat.type === 'income');

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

  const createIncomeMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/transactions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: [`/api/monthly-data/${selectedMonth}`] });
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
          {currencySymbol}{totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  {currencySymbol}{category.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
            {incomeTransactions.slice(0, 5).map((transaction: any) => {
              const category = allCategories.find((c: any) => c.id === transaction.categoryId);
              return (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()} • {category?.name || 'Uncategorized'}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-green-600 dark:text-green-400">
                    {currencySymbol}{Math.abs(parseFloat(transaction.amount)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
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
                placeholder="e.g., Monthly Salary"
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
    </div>
  );
}
