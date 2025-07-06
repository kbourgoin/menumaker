import { Column, SortDirection } from "@/components/dish-table/types";
import { cn } from "@/lib/utils";
import { TableHead } from "@/components/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";

interface TableColumnHeaderProps {
  column: Column;
  children: React.ReactNode;
  className?: string;
  currentSort: string;
  sortDirection: SortDirection;
  onSort: (column: string) => void;
}

const TableColumnHeader = ({
  column,
  children,
  className,
  currentSort,
  sortDirection,
  onSort,
}: TableColumnHeaderProps) => {
  const isActive = currentSort === column;

  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none",
        isActive && "text-primary",
        className
      )}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {isActive && (
          <span className="inline-flex ml-1">
            {sortDirection === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )}
          </span>
        )}
      </div>
    </TableHead>
  );
};

export default TableColumnHeader;
