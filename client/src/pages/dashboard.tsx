import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MonthSelector } from "@/components/month-selector";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingDown } from "lucide-react";
import { CategoryBadge } from "@/components/category-badge";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { UserSettings, MonthlyData, Transaction, Category } from "@shared/schema";

// Helper to get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const { toast } = useToast();

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

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery<MonthlyData>({
    queryKey: ["/api/monthly-data", selectedMonth],
    queryFn: async () => {
      const data = await apiRequest("GET", `/api/monthly-data/${selectedMonth}`, undefined);
      return data || { income: "0", expenses: "0", savings: "0", investments: "0" };
    },
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", selectedMonth],
    queryFn: async () => {
      const data = await apiRequest("GET", `/api/transactions?month=${selectedMonth}`, undefined);
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Ensure transactions is always an array IMMEDIATELY after query definition
  const transactions: Transaction[] = transactionsData ?? [];

  const isLoading = monthlyLoading || transactionsLoading;

  // Calculate category breakdown from transactions (expenses only)
  const expenseCategories = categories.filter((cat: any) => cat.type === 'expense');
  const expenseTransactions = transactions.filter((t: any) => t.type === 'expense');
  
  const categoryBreakdown = expenseCategories.map((cat: any) => {
    const catTransactions = expenseTransactions.filter((t: any) => t.categoryId === cat.id);
    const total = catTransactions.reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount)), 0);
    return {
      id: cat.id,
      name: cat.name,
      amount: total,
      color: cat.color,
    };
  }).filter((cat: any) => cat.amount > 0);

  const totalExpenses = categoryBreakdown.reduce((sum: number, cat: any) => sum + cat.amount, 0);

  const categoriesWithPercentage = categoryBreakdown.map((cat: any) => ({
    ...cat,
    percentage: totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0,
  })).sort((a: any, b: any) => b.amount - a.amount);

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const income = monthlyData?.income ? parseFloat(monthlyData.income) : 0;
  const expenses = monthlyData?.expenses ? parseFloat(monthlyData.expenses) : 0;
  const savings = monthlyData?.savings ? parseFloat(monthlyData.savings) : 0;
  const investments = monthlyData?.investments ? parseFloat(monthlyData.investments) : 0;
  const netIncome = income - expenses;

  if (isLoading) {
    return (
      <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6">
        <div className="h-12 bg-card rounded-lg animate-pulse" />
        <div className="h-48 bg-card rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-card rounded-lg animate-pulse" />
          <div className="h-32 bg-card rounded-lg animate-pulse" />
        </div>
        <div className="h-64 bg-card rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6">
      {/* Month Selector */}
      <MonthSelector month={selectedMonth} onMonthChange={setSelectedMonth} />

      {/* Main Balance Card */}
      <Card className="p-6">
        <p className="text-sm text-muted-foreground mb-2">Net Income</p>
        <p className="text-4xl font-bold tabular-nums mb-6" data-testid="text-net-income">
          {showSymbolAfter ? `${formatCurrency(netIncome)} ${currencySymbol}` : `${currencySymbol}${formatCurrency(netIncome)}`}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Income
            </p>
            <p className="text-lg font-semibold tabular-nums text-green-600 dark:text-green-400 mt-1" data-testid="text-income">
              {showSymbolAfter ? `${formatCurrency(income)} ${currencySymbol}` : `${currencySymbol}${formatCurrency(income)}`}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Expenses
            </p>
            <p className="text-lg font-semibold tabular-nums text-red-600 dark:text-red-400 mt-1" data-testid="text-expenses">
              {showSymbolAfter ? `${formatCurrency(expenses)} ${currencySymbol}` : `${currencySymbol}${formatCurrency(expenses)}`}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Saved
            </p>
            <p className="text-lg font-semibold tabular-nums mt-1" data-testid="text-savings">
              {showSymbolAfter ? `${formatCurrency(savings)} ${currencySymbol}` : `${currencySymbol}${formatCurrency(savings)}`}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Invested
            </p>
            <p className="text-lg font-semibold tabular-nums mt-1" data-testid="text-investments">
              {showSymbolAfter ? `${formatCurrency(investments)} ${currencySymbol}` : `${currencySymbol}${formatCurrency(investments)}`}
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Monthly Income"
          value={showSymbolAfter ? `${formatCurrency(income)} ${currencySymbol}` : `${currencySymbol}${formatCurrency(income)}`}
          icon={DollarSign}
          testId="stat-income"
        />
        <StatCard
          label="Monthly Expenses"
          value={showSymbolAfter ? `${formatCurrency(expenses)} ${currencySymbol}` : `${currencySymbol}${formatCurrency(expenses)}`}
          icon={TrendingDown}
          testId="stat-expenses"
        />
      </div>

      {/* Category Breakdown */}
      {categoriesWithPercentage.length > 0 ? (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
          <div className="space-y-4">
            {categoriesWithPercentage.map((category: any) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <CategoryBadge name={category.name} color={category.color} />
                  <span className="text-sm font-semibold tabular-nums">
                    {showSymbolAfter ? `${formatCurrency(category.amount)} ${currencySymbol}` : `${currencySymbol}${formatCurrency(category.amount)}`}
                  </span>
                </div>
                <Progress
                  value={category.percentage}
                  className="h-2"
                  style={{
                    // @ts-ignore
                    "--progress-background": category.color
                  } as React.CSSProperties}
                />
                <p className="text-xs text-muted-foreground text-right tabular-nums">
                  {category.percentage.toFixed(1)}% of total
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            No transactions yet for this month
          </p>
        </Card>
      )}
    </div>
  );
}