import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthSelectorProps {
  month: string; // Format: YYYY-MM
  onMonthChange: (month: string) => void;
}

export function MonthSelector({ month, onMonthChange }: MonthSelectorProps) {
  const date = new Date(month + "-01");
  
  const handlePrevMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(formatMonth(newDate));
  };

  const handleNextMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(formatMonth(newDate));
  };

  const formatMonth = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const displayMonth = date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevMonth}
        data-testid="button-prev-month"
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <h2 className="text-lg font-semibold tabular-nums" data-testid="text-current-month">
        {displayMonth}
      </h2>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNextMonth}
        data-testid="button-next-month"
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
