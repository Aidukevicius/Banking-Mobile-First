import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  name: string;
  color?: string;
  className?: string;
}

export function CategoryBadge({ name, color = "#3B82F6", className }: CategoryBadgeProps) {
  return (
    <Badge 
      variant="secondary" 
      className={cn("gap-1.5 px-2 py-1", className)}
      style={{ borderColor: color + "40", backgroundColor: color + "15" }}
    >
      <Tag className="w-3 h-3" style={{ color }} />
      <span className="text-xs">{name}</span>
    </Badge>
  );
}
