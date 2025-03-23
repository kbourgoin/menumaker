
import { Link } from "react-router-dom";
import { Dish } from "@/types";
import { TableCell, TableRow as UITableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import SourceInfo from "../dish-card/SourceInfo";

interface DishTableRowProps {
  dish: Dish;
  sourceInfoMap: Record<string, { name: string, type: string, url?: string }>;
}

const DishTableRow = ({ dish, sourceInfoMap }: DishTableRowProps) => {
  // Get source info from our lookup map if available
  const sourceInfo = dish.sourceId ? sourceInfoMap[dish.sourceId] : null;
  
  return (
    <UITableRow>
      <TableCell>
        <Link 
          to={`/meal/${dish.id}`} 
          className="text-primary hover:underline font-medium"
        >
          {dish.name}
        </Link>
      </TableCell>
      <TableCell className="max-w-[200px] break-words">
        <SourceInfo 
          sourceId={dish.sourceId} 
          // Pass source info directly when available
          sourceName={sourceInfo?.name}
          sourceType={sourceInfo?.type}
          sourceUrl={sourceInfo?.url}
          location={dish.location} 
        />
      </TableCell>
      <TableCell>{dish.cuisines.join(", ")}</TableCell>
      <TableCell className="text-right">{dish.timesCooked || 0}</TableCell>
      <TableCell>
        {dish.lastMade 
          ? formatDate(new Date(dish.lastMade)) 
          : "Never"}
      </TableCell>
      <TableCell className="max-w-md">
        {dish.lastComment && (
          <p className="text-sm text-muted-foreground italic break-words">
            "{dish.lastComment}"
          </p>
        )}
      </TableCell>
    </UITableRow>
  );
};

export default DishTableRow;
