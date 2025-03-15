
import { CardContent } from "@/components/ui/card";
import CuisinesList from "./CuisinesList";
import CookingInfo from "./CookingInfo";
import SourceInfo from "./SourceInfo";

interface DishCardContentProps {
  cuisines: string[];
  lastMade?: string;
  timesCooked: number;
  sourceId?: string;
  location?: string;
  compact?: boolean;
}

const DishCardContent = ({ 
  cuisines, 
  lastMade, 
  timesCooked, 
  sourceId, 
  location, 
  compact = false 
}: DishCardContentProps) => {
  return (
    <CardContent className={`${compact ? "pb-2 px-4" : "pb-6"} flex-grow`}>
      <div className="space-y-3">
        <CuisinesList cuisines={cuisines || []} compact={compact} />
        
        <CookingInfo 
          lastMade={lastMade} 
          timesCooked={timesCooked || 0} 
          compact={compact} 
        />
        
        <SourceInfo sourceId={sourceId} location={location} />
      </div>
    </CardContent>
  );
};

export default DishCardContent;
