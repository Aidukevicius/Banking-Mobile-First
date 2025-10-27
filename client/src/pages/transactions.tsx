import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Search, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { CategoryBadge } from "@/components/category-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/api";

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [addTransactionDialogOpen, setAddTransactionDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    provider: "",
    description: "",
    amount: "",
    categoryId: "",
  });
  const { toast } = useToast();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Only show expense categories for transaction categorization
  const categories = allCategories.filter((cat: any) => cat.type === 'expense');

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

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("pdf", file);

      const token = getAuthToken();
      const response = await fetch("/api/transactions/upload-pdf", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data"] });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      toast({
        title: "PDF processed successfully!",
        description: `${data.total} transactions found. ${data.categorized} auto-categorized, ${data.uncategorized} need review.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, categoryId }: { id: string; categoryId: string }) =>
      apiRequest("PUT", `/api/transactions/${id}`, { categoryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data"] });
      setCategoryDialogOpen(false);
      toast({
        title: "Transaction categorized",
        description: "Category has been saved and will be used for future similar transactions",
      });
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/transactions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data"] });
      setAddTransactionDialogOpen(false);
      setNewTransaction({
        date: new Date().toISOString().split('T')[0],
        provider: "",
        description: "",
        amount: "",
        categoryId: "",
      });
      toast({
        title: "Transaction added",
        description: "Your transaction has been created successfully",
      });
    },
  });

  const filteredTransactions = transactions.filter((t: any) =>
    t.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTransactions = filteredTransactions.reduce((acc: any, transaction: any) => {
    const date = new Date(transaction.date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {});

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile);
  };

  const handleAssignCategory = (categoryId: string) => {
    if (!selectedTransaction) return;
    updateTransactionMutation.mutate({
      id: selectedTransaction.id,
      categoryId,
    });
  };

  const handleCreateTransaction = () => {
    if (!newTransaction.provider || !newTransaction.amount) return;

    const monthYear = newTransaction.date.substring(0, 7);
    createTransactionMutation.mutate({
      type: "expense",
      date: new Date(newTransaction.date).toISOString(),
      provider: newTransaction.provider,
      description: newTransaction.description || newTransaction.provider,
      amount: parseFloat(newTransaction.amount).toString(),
      categoryId: newTransaction.categoryId || null,
      monthYear,
    });
  };

  if (isLoading) {
    return (
      <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-card rounded animate-pulse" />
          <div className="h-10 w-32 bg-card rounded animate-pulse" />
        </div>
        <div className="h-12 bg-card rounded-lg animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-card rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setAddTransactionDialogOpen(true)}
            variant="outline"
            data-testid="button-add-transaction"
          >
            <Upload className="w-4 h-4 mr-2" />
            Add
          </Button>
          <Button
            onClick={() => setUploadDialogOpen(true)}
            data-testid="button-upload-pdf"
          >
            <Upload className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12"
          data-testid="input-search-transactions"
        />
      </div>

      {/* Transactions List */}
      {Object.keys(groupedTransactions).length === 0 ? (
        <Card className="p-8">
          <div className="text-center space-y-3">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground">
              Upload a PDF bank statement to get started
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([date, dateTransactions]: [string, any]) => (
            <div key={date}>
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-2 mb-3 z-10">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {date}
                </h3>
              </div>
              <div className="space-y-3">
                {dateTransactions.map((transaction: any) => {
                  const category = categories.find((c: any) => c.id === transaction.categoryId);
                  return (
                    <Card
                      key={transaction.id}
                      className={cn(
                        "p-4 hover-elevate active-elevate-2 cursor-pointer",
                        !transaction.categoryId && "border-l-4 border-l-amber-500"
                      )}
                      onClick={() => {
                        if (!transaction.categoryId) {
                          setSelectedTransaction(transaction);
                          setCategoryDialogOpen(true);
                        }
                      }}
                      data-testid={`card-transaction-${transaction.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{transaction.provider}</p>
                          <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {transaction.categoryId ? (
                            <CategoryBadge categoryId={transaction.categoryId} categories={categories} />
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Uncategorized
                            </Badge>
                          )}
                          <p className={`text-lg font-semibold tabular-nums whitespace-nowrap ${
                            transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {transaction.type === 'expense' ? '-' : '+'}
                            {currencySymbol}{parseFloat(transaction.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload PDF Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Bank Statement</DialogTitle>
            <DialogDescription>
              Upload a PDF bank statement to automatically extract and categorize transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pdf-upload">PDF File</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover-elevate">
                <input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="input-pdf-file"
                  disabled={uploadMutation.isPending}
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    {selectedFile ? selectedFile.name : "Click to upload PDF"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Bank statement in PDF format
                  </p>
                </label>
              </div>
            </div>
            {selectedFile && !uploadMutation.isPending && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  File selected: {selectedFile.name}
                </span>
              </div>
            )}
            {uploadMutation.isPending && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Processing PDF...
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
              className="flex-1"
              disabled={uploadMutation.isPending}
              data-testid="button-cancel-upload"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="flex-1"
              data-testid="button-confirm-upload"
            >
              {uploadMutation.isPending ? "Processing..." : "Upload & Process"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={addTransactionDialogOpen} onOpenChange={setAddTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              Manually add a new transaction to your records.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newTransaction.date}
                onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider/Merchant</Label>
              <Input
                id="provider"
                placeholder="e.g., Amazon, Whole Foods"
                value={newTransaction.provider}
                onChange={(e) => setNewTransaction({ ...newTransaction, provider: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Transaction details"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                className="text-right tabular-nums"
              />
              <p className="text-xs text-muted-foreground">Use negative for expenses, positive for income</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <select
                id="category"
                value={newTransaction.categoryId}
                onChange={(e) => setNewTransaction({ ...newTransaction, categoryId: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">None</option>
                {categories.filter((cat: any) => cat.type === 'expense').map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setAddTransactionDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTransaction}
              disabled={!newTransaction.provider || !newTransaction.amount || createTransactionMutation.isPending}
              className="flex-1"
            >
              Add Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Assignment Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Category</DialogTitle>
            <DialogDescription>
              Choose a category for this transaction. Your choice will be saved for future transactions from this provider.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {categories.filter((cat: any) => cat.type === 'expense').length === 0 ? (
              <p className="col-span-2 text-center text-muted-foreground py-4">
                No expense categories yet. Create one in the Categories tab first.
              </p>
            ) : (
              categories.filter((cat: any) => cat.type === 'expense').map((cat: any) => (
                <Button
                  key={cat.id}
                  variant="outline"
                  className="h-12"
                  onClick={() => handleAssignCategory(cat.id)}
                  disabled={updateTransactionMutation.isPending}
                  data-testid={`button-category-${cat.name.toLowerCase()}`}
                >
                  {cat.name}
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}