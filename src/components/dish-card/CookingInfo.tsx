
import { Calendar, UtensilsCrossed } from "lucide-react";
import { format, formatDistance, parseISO } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface CookingInfoProps {
  lastMade?: string;
  timesCooked: number;
  compact?: boolean;
}

const CookingInfo = ({ lastMade, timesCooked, compact = false }: CookingInfoProps) => {
  const formatDate = (dateString: string | undefined) => {
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
        // For other cases, use the standard formatDistance but calculate from the truncated current date
        return formatDistance(dateOnly, nowDateOnly, { addSuffix: true });
      }
    } catch (e) {
      console.error("Error parsing date", e);
      return "";
    }
  };

  return (
    <div className={`text-sm text-muted-foreground ${compact ? "text-xs" : ""}`}>
      <div className="flex items-center space-x-1">
        <UtensilsCrossed className="w-3.5 h-3.5 mr-1" />
        <span>Made {timesCooked || 0} {timesCooked === 1 ? "time" : "times"}</span>
      </div>

      <div className="flex items-center space-x-1 mt-1">
        <Calendar className="w-3.5 h-3.5 mr-1" />
        <span>Last made: </span>
        {lastMade ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">{formatTimeAgo(lastMade)}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{formatDate(lastMade)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span>Never</span>
        )}
      </div>
    </div>
  );
};

export default CookingInfo;
