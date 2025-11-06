import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Tag, Trash2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Category } from "@shared/schema";

export default function Categories() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryName, setCategoryName] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const [categoryType, setCategoryType] = useState<"expense" | "income">("expense");
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category created successfully" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PUT", `/api/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category updated successfully" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/categories/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category deleted" });
    },
  });

  const colorOptions = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
    "#8B5CF6", "#EC4899", "#14B8A6", "#F97316",
  ];

  const handleOpenDialog = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
      setSelectedColor(category.color);
      setBudgetLimit(category.budgetLimit || "");
      setCategoryType(category.type || "expense");
    } else {
      // When adding new category, use the active tab type
      setCategoryType(activeTab);
    }
    setDialogOpen(true);
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setCategoryName("");
    setBudgetLimit("");
    setSelectedColor("#3B82F6");
    setCategoryType("expense");
  };

  const handleSaveCategory = () => {
    const data = {
      name: categoryName,
      color: selectedColor,
      icon: "tag",
      type: categoryType,
      budgetLimit: budgetLimit || null,
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-card rounded animate-pulse" />
          <div className="h-10 w-32 bg-card rounded animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-card rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const expenseCategories = categories.filter((cat: any) => cat.type === 'expense');
  const incomeCategories = categories.filter((cat: any) => cat.type === 'income');

  const renderCategoryList = (categoryList: any[], type: 'expense' | 'income') => {
    if (categoryList.length === 0) {
      return (
        <Card className="p-8">
          <div className="text-center space-y-3">
            <Tag className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No {type} categories yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first {type} category
            </p>
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {categoryList.map((category: any) => (
          <Card key={category.id} className="p-4 hover-elevate" data-testid={`card-category-${category.id}`}>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: category.color + "20" }}
              >
                <Tag className="w-6 h-6" style={{ color: category.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg">{category.name}</h3>
                {category.budgetLimit && (
                  <p className="text-sm text-muted-foreground">
                    Budget: ${parseFloat(category.budgetLimit).toFixed(2)}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenDialog(category)}
                  data-testid={`button-edit-${category.id}`}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(category.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-${category.id}`}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="pb-20 px-4 pt-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
      </div>

      {/* Tabs for Expense and Income Categories */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "expense" | "income")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expense">Expense Categories</TabsTrigger>
          <TabsTrigger value="income">Income Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="expense" className="space-y-4 mt-6">
          <Button onClick={() => handleOpenDialog()} className="w-full" data-testid="button-add-expense-category">
            <Plus className="w-4 h-4 mr-2" />
            Add Expense Category
          </Button>
          {renderCategoryList(expenseCategories, 'expense')}
        </TabsContent>
        
        <TabsContent value="income" className="space-y-4 mt-6">
          <Button onClick={() => handleOpenDialog()} className="w-full" data-testid="button-add-income-category">
            <Plus className="w-4 h-4 mr-2" />
            Add Income Category
          </Button>
          {renderCategoryList(incomeCategories, 'income')}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Update" : "Create a new"} category to organize your transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                placeholder="e.g., Groceries"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="h-12"
                data-testid="input-category-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-8 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className="w-10 h-10 rounded-lg border-2 transition-all hover-elevate"
                    style={{
                      backgroundColor: color,
                      borderColor: selectedColor === color ? color : "transparent",
                      transform: selectedColor === color ? "scale(1.1)" : "scale(1)",
                    }}
                    data-testid={`button-color-${color}`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-limit">Monthly Budget (Optional)</Label>
              <Input
                id="budget-limit"
                type="number"
                placeholder="0.00"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                className="h-12 text-right tabular-nums"
                data-testid="input-budget-limit"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={resetForm}
              className="flex-1"
              data-testid="button-cancel-category"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCategory}
              disabled={!categoryName || createMutation.isPending || updateMutation.isPending}
              className="flex-1"
              data-testid="button-save-category"
            >
              {editingCategory ? "Update" : "Save"} Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
