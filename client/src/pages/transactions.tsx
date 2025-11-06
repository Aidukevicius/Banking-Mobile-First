import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Search, FileText, CheckCircle, AlertCircle, Loader2, Edit2, Trash2 } from "lucide-react";
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
import type { Transaction, Category, UserSettings } from "@shared/schema";

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [addTransactionDialogOpen, setAddTransactionDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editedTransaction, setEditedTransaction] = useState<{
    id: string;
    amount: string;
    categoryId: string;
    type: string;
  } | null>(null);
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    provider: "",
    description: "",
    amount: "",
    categoryId: "",
    type: "expense" as "income" | "expense",
  });
  const { toast } = useToast();

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: allCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data"], exact: false });
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
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data"], exact: false });
      setCategoryDialogOpen(false);
      toast({
        title: "Transaction categorized",
        description: "Category has been saved and will be used for future similar transactions",
      });
    },
  });

  const updateTransactionDetailsMutation = useMutation({
    mutationFn: ({ id, amount, categoryId, type, monthYear }: { id: string; amount: string; categoryId?: string; type?: string; monthYear?: string }) =>
      apiRequest("PUT", `/api/transactions/${id}`, { amount, categoryId, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data"], exact: false });
      setEditDialogOpen(false);
      setEditedTransaction(null);
      toast({
        title: "Transaction updated",
        description: "Your changes have been saved successfully",
      });
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data: {
      type: string;
      date: string;
      provider: string;
      description: string;
      amount: string;
      categoryId: string | null;
      monthYear: string;
    }) => apiRequest("POST", "/api/transactions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setAddTransactionDialogOpen(false);
      setNewTransaction({
        date: new Date().toISOString().split('T')[0],
        provider: "",
        description: "",
        amount: "",
        categoryId: "",
        type: "expense",
      });
      toast({
        title: "Transaction added",
        description: "Your transaction has been created successfully",
      });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/transactions/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data"], exact: false });
      toast({
        title: "Transaction deleted",
        description: "Transaction has been removed successfully",
      });
    },
  });

  const clearAllTransactionsMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/transactions/clear-all", undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-data"], exact: false });
      setClearAllDialogOpen(false);
      toast({
        title: "All transactions cleared",
        description: "All your transactions have been removed successfully",
      });
    },
  });

  const filteredTransactions = transactions.filter((t) =>
    (t.provider?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (t.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const groupedTransactions = filteredTransactions.reduce((acc: Record<string, Transaction[]>, transaction) => {
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

  const handleEditTransaction = () => {
    if (!editedTransaction) return;
    
    // Find the original transaction to get its monthYear
    const originalTransaction = transactions.find(t => t.id === editedTransaction.id);
    if (!originalTransaction) return;
    
    updateTransactionDetailsMutation.mutate({
      id: editedTransaction.id,
      amount: editedTransaction.amount,
      categoryId: editedTransaction.categoryId || undefined,
      type: editedTransaction.type,
      monthYear: originalTransaction.monthYear,
    });
  };

  const handleDeleteTransaction = () => {
    if (!selectedTransaction) return;
    deleteTransactionMutation.mutate(selectedTransaction.id);
    setDeleteDialogOpen(false);
  };

  const handleCreateTransaction = () => {
    if (!newTransaction.provider || !newTransaction.amount) return;

    const monthYear = newTransaction.date.substring(0, 7);
    const amount = parseFloat(newTransaction.amount);
    
    createTransactionMutation.mutate({
      type: newTransaction.type,
      date: new Date(newTransaction.date).toISOString(),
      provider: newTransaction.provider,
      description: newTransaction.description || newTransaction.provider,
      amount: Math.abs(amount).toString(),
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
          {transactions.length > 0 && (
            <Button
              onClick={() => setClearAllDialogOpen(true)}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              data-testid="button-clear-all"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
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
          {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
            <div key={date}>
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-2 mb-3 z-10">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {date}
                </h3>
              </div>
              <div className="space-y-3">
                {dateTransactions.map((transaction) => {
                  const category = allCategories.find((c) => c.id === transaction.categoryId);
                  return (
                    <Card
                      key={transaction.id}
                      className={cn(
                        "p-4 hover-elevate active-elevate-2",
                        !transaction.categoryId && "border-l-4 border-l-amber-500"
                      )}
                      data-testid={`card-transaction-${transaction.id}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{transaction.provider}</p>
                          <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div 
                            className="cursor-pointer" 
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setCategoryDialogOpen(true);
                            }}
                            data-testid={`badge-category-${transaction.id}`}
                          >
                            {transaction.categoryId ? (
                              <CategoryBadge categoryId={transaction.categoryId} categories={allCategories} />
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground hover:bg-muted">
                                Uncategorized
                              </Badge>
                            )}
                          </div>
                          <p className={`text-lg font-semibold tabular-nums whitespace-nowrap ${
                            transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {transaction.type === 'expense' ? '-' : '+'}
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
                                  type: transaction.type,
                                });
                                setEditDialogOpen(true);
                              }}
                              data-testid={`button-edit-${transaction.id}`}
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
                              data-testid={`button-delete-${transaction.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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
              <Label>Transaction Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={newTransaction.type === "expense" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setNewTransaction({ ...newTransaction, type: "expense" })}
                >
                  Expense
                </Button>
                <Button
                  type="button"
                  variant={newTransaction.type === "income" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setNewTransaction({ ...newTransaction, type: "income" })}
                >
                  Income
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider/Merchant</Label>
              <Input
                id="provider"
                placeholder="e.g., Amazon, Whole Foods, Salary"
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
              <Label htmlFor="amount">Amount ({currencySymbol})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                className="text-right tabular-nums"
              />
              <p className="text-xs text-muted-foreground">
                Enter the amount as a positive number
              </p>
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
                <optgroup label="Expense Categories">
                  {allCategories.filter((cat) => cat.type === 'expense').map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Income Categories">
                  {allCategories.filter((cat) => cat.type === 'income').map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </optgroup>
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
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              {selectedTransaction?.type === 'income' 
                ? 'Choose an income category for this transaction.'
                : 'Choose an expense category for this transaction.'
              } Your choice will be saved for future transactions from this provider.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction?.categoryId && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Current category:</p>
              <CategoryBadge categoryId={selectedTransaction.categoryId} categories={allCategories} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 py-4">
            {(() => {
              const transactionType = selectedTransaction?.type || 'expense';
              const filteredCategories = allCategories.filter((cat) => cat.type === transactionType);
              
              if (filteredCategories.length === 0) {
                return (
                  <p className="col-span-2 text-center text-muted-foreground py-4">
                    No {transactionType} categories yet. Create one in the Categories tab first.
                  </p>
                );
              }
              
              return filteredCategories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedTransaction?.categoryId === cat.id ? "default" : "outline"}
                  className="h-12"
                  onClick={() => handleAssignCategory(cat.id)}
                  disabled={updateTransactionMutation.isPending}
                  data-testid={`button-category-${cat.name.toLowerCase()}`}
                >
                  {cat.name}
                </Button>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog - Amount Only */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update the transaction amount and type. To change the category, click on the category badge.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={editedTransaction?.type === "expense" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    if (editedTransaction) {
                      setEditedTransaction({ ...editedTransaction, type: "expense" });
                    }
                  }}
                >
                  Expense
                </Button>
                <Button
                  type="button"
                  variant={editedTransaction?.type === "income" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    if (editedTransaction) {
                      setEditedTransaction({ ...editedTransaction, type: "income" });
                    }
                  }}
                >
                  Income
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount ({currencySymbol})</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={editedTransaction?.amount || ""}
                onChange={(e) => {
                  if (editedTransaction) {
                    setEditedTransaction({ ...editedTransaction, amount: e.target.value });
                  }
                }}
                className="text-right tabular-nums"
                data-testid="input-edit-amount"
              />
              <p className="text-xs text-muted-foreground">
                Enter the amount as a positive number
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="flex-1"
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditTransaction}
              disabled={!editedTransaction?.amount || updateTransactionDetailsMutation.isPending}
              className="flex-1"
              data-testid="button-save-edit"
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
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Provider:</span>
                <span className="text-sm">{selectedTransaction.provider}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Amount:</span>
                <span className={`text-sm font-semibold ${selectedTransaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                  {selectedTransaction.type === 'expense' ? '-' : '+'}
                  {showSymbolAfter 
                    ? `${Math.abs(parseFloat(selectedTransaction.amount)).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currencySymbol}`
                    : `${currencySymbol}${Math.abs(parseFloat(selectedTransaction.amount)).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
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

      {/* Clear All Confirmation Dialog */}
      <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Transactions</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete ALL {transactions.length} transactions? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                This will permanently delete all your transactions and reset all monthly data.
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setClearAllDialogOpen(false)}
              className="flex-1"
              disabled={clearAllTransactionsMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => clearAllTransactionsMutation.mutate()}
              disabled={clearAllTransactionsMutation.isPending}
              className="flex-1"
            >
              {clearAllTransactionsMutation.isPending ? "Clearing..." : "Clear All"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}