
import { Calendar } from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
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
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch (e) {
      console.error("Error parsing date", e);
      return "";
    }
  };

  return (
    <div className={`text-sm text-muted-foreground ${compact ? "text-xs" : ""}`}>
      <div className="flex items-center space-x-1">
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
      <div className="mt-1">
        Made {timesCooked || 0} {timesCooked === 1 ? "time" : "times"}
      </div>
    </div>
  );
};

export default CookingInfo;
