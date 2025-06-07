
import { Link } from "react-router-dom";
import { Dish } from "@/types";
import { TableCell, TableRow as UITableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { formatDistance, parseISO, format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import SourceInfo from "../dish-card/SourceInfo";

interface DishTableRowProps {
  dish: Dish;
  sourceInfoMap: Record<string, { name: string, type: string, url?: string }>;
}

const DishTableRow = ({ dish, sourceInfoMap }: DishTableRowProps) => {
  // Get source info from our lookup map if available
  const sourceInfo = dish.sourceId ? sourceInfoMap[dish.sourceId] : null;

  const formatAbsoluteDate = (dateString: string | undefined) => {
    if (!dateString) return "Never";
    try {
      return format(parseISO(dateString), "MMMM d, yyyy");
    } catch (e) {
      console.error("Error parsing date", e);
      return "Invalid date";
    }
  };

  const formatTimeAgo = (dateString: string | undefined) => {
    if (!dateString) return "";
    try {
      // Parse the date and truncate to just the date (no time)
      const date = parseISO(dateString);
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      // Calculate the difference in days and format accordingly
      const now = new Date();
      const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const diffInMs = nowDateOnly.getTime() - dateOnly.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));


      if (diffInDays === 0) {
        return "today";
      } else if (diffInDays === 1) {
        return "yesterday";
      } else if (diffInDays === -1) {
        return "tomorrow";
      } else {
        return formatDistance(dateOnly, nowDateOnly, { addSuffix: true });
      }
    } catch (e) {
      console.error("Error parsing date", e);
      return "";
    }
  };

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
      <TableCell className="w-[200px] min-w-0">
        <div className="break-words">
          <SourceInfo
            sourceId={dish.sourceId}
            // Pass source info directly when available
            sourceName={sourceInfo?.name}
            sourceType={sourceInfo?.type}
            sourceUrl={sourceInfo?.url}
            location={dish.location}
          />
        </div>
      </TableCell>
      <TableCell>{dish.cuisines.join(", ")}</TableCell>
      <TableCell className="text-right">{dish.timesCooked || 0}</TableCell>
      <TableCell>
        {dish.lastMade ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">{formatTimeAgo(dish.lastMade)}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{formatAbsoluteDate(dish.lastMade)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          "Never"
        )}
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
