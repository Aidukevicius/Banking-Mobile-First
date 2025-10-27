import { Link, useLocation } from "wouter";
import { Home, FileText, DollarSign, TrendingUp, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/transactions", label: "Expenses", icon: FileText },
  { path: "/income", label: "Income", icon: DollarSign },
  { path: "/portfolio", label: "Portfolio", icon: TrendingUp },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-card-border z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location === path;
          return (
            <Link
              key={path}
              href={path}
              data-testid={`link-nav-${label.toLowerCase()}`}
            >
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg min-w-[64px] transition-colors hover-elevate active-elevate-2 cursor-pointer",
                  isActive && "bg-primary/10"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}