import { Link, useLocation } from "wouter";
import { Home, FileText, DollarSign, TrendingUp, Settings, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/transactions", label: "Expenses", icon: FileText },
  { path: "/income", label: "Income", icon: DollarSign },
  { path: "/categories", label: "Categories", icon: Tag },
  { path: "/portfolio", label: "Portfolio", icon: TrendingUp },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-card-border z-50">
      <div className="overflow-x-auto scrollbar-hide pb-safe">
        <div className="flex items-center justify-start sm:justify-around h-16 px-2 min-w-max sm:min-w-0">
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
                    "flex flex-col items-center justify-center gap-1 px-2.5 sm:px-3 py-2 rounded-lg min-w-[60px] sm:min-w-[64px] transition-colors hover-elevate active-elevate-2 cursor-pointer",
                    isActive && "bg-primary/10"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] sm:text-xs font-medium whitespace-nowrap",
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
      </div>
    </nav>
  );
}