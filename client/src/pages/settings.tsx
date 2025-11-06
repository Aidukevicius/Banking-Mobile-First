import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogOut, DollarSign, Palette } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";
import type { UserSettings } from "@shared/schema";
import { useLocation } from "wouter";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: { currency?: string; theme?: string }) =>
      apiRequest("PUT", "/api/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved",
      });
    },
  });

  const handleCurrencyChange = (currency: string) => {
    updateSettingsMutation.mutate({ currency });
  };

  const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? "dark" : "light";
    setTheme(newTheme);
    updateSettingsMutation.mutate({ theme: newTheme });
  };

  const currencies = [
    { value: "USD", label: "USD - US Dollar", symbol: "$" },
    { value: "EUR", label: "EUR - Euro", symbol: "€" },
    { value: "GBP", label: "GBP - British Pound", symbol: "£" },
    { value: "JPY", label: "JPY - Japanese Yen", symbol: "¥" },
    { value: "CAD", label: "CAD - Canadian Dollar", symbol: "C$" },
    { value: "AUD", label: "AUD - Australian Dollar", symbol: "A$" },
    { value: "RON", label: "RON - Romanian Leu", symbol: "lei" },
    { value: "CHF", label: "CHF - Swiss Franc", symbol: "CHF" },
    { value: "SEK", label: "SEK - Swedish Krona", symbol: "kr" },
    { value: "NOK", label: "NOK - Norwegian Krone", symbol: "kr" },
  ];

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="pb-20 px-4 pt-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div className="space-y-4">
          <div className="h-24 bg-card rounded-lg animate-pulse" />
          <div className="h-32 bg-card rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 sm:pb-20 px-4 pt-4 sm:pt-6 max-w-lg mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>

      {/* Account Info Section */}
      <div className="space-y-2 sm:space-y-3">
        <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Account
        </h2>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Label className="text-base font-medium">Username</Label>
              <p className="text-sm text-muted-foreground">
                {user?.username || 'Not logged in'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Appearance Section */}
      <div className="space-y-2 sm:space-y-3">
        <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Appearance
        </h2>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="theme-toggle" className="text-base font-medium cursor-pointer">
                  Dark Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  {theme === "dark" ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>
            <Switch
              id="theme-toggle"
              checked={theme === "dark"}
              onCheckedChange={handleThemeChange}
              data-testid="switch-theme"
            />
          </div>
        </Card>
      </div>

      {/* Currency Section */}
      <div className="space-y-2 sm:space-y-3">
        <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Currency
        </h2>
        <Card className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">
                {settings?.currency || "USD"}
              </span>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <Label htmlFor="currency-select" className="text-base font-medium">
                  Display Currency
                </Label>
                <p className="text-sm text-muted-foreground">
                  All amounts will be displayed in this currency
                </p>
              </div>
              <Select value={settings?.currency || "USD"} onValueChange={handleCurrencyChange}>
                <SelectTrigger id="currency-select" className="h-12" data-testid="select-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </div>

      {/* Logout Section */}
      <div className="space-y-2 sm:space-y-3">
        <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Logout
        </h2>
        <Card className="p-3 sm:p-4">
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full h-12"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </Card>
      </div>

      {/* App Info */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>Finance Tracker v1.0.0</p>
        <p className="mt-1">© 2024 All rights reserved</p>
      </div>
    </div>
  );
}
