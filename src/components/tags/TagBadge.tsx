import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  tag: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export const TagBadge = ({
  tag,
  variant = "secondary",
  removable = false,
  onRemove,
  className,
}: TagBadgeProps) => {
  return (
    <Badge
      variant={variant}
      className={cn(
        "text-xs gap-1",
        removable && "pr-1",
        className
      )}
    >
      {tag}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
};