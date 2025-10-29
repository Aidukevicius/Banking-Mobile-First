
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/bottom-nav";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Categories from "@/pages/categories";
import Portfolio from "@/pages/portfolio";
import Income from "@/pages/income";
import Settings from "@/pages/settings";
import AuthPage from "@/pages/auth";
import ResetPasswordPage from "@/pages/reset-password";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { user, login, register, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Switch>
        <Route path="/reset-password" component={ResetPasswordPage} />
        {!user ? (
          <Route path="/" component={() => <AuthPage onLogin={login} onRegister={register} isLoading={isLoading} />} />
        ) : (
          <>
            <Route path="/" component={Dashboard} />
            <Route path="/transactions" component={Transactions} />
            <Route path="/categories" component={Categories} />
            <Route path="/income" component={Income} />
            <Route path="/portfolio" component={Portfolio} />
            <Route path="/settings" component={Settings} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      {user && <BottomNav />}
    </div>
  );
}

export default App;
