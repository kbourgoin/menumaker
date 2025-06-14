
import { CardContent } from "@/components/ui/card";
import CuisinesList from "./CuisinesList";
import CookingInfo from "./CookingInfo";
import SourceInfo from "./SourceInfo";
import { TagBadge } from "@/components/tags";
import { useTagNavigation } from "@/hooks/useTagNavigation";

interface DishCardContentProps {
  cuisines: string[];
  lastMade?: string;
  timesCooked: number;
  sourceId?: string;
  location?: string;
  compact?: boolean;
  lastComment?: string;
  tags?: string[];
}

const DishCardContent = ({ 
  cuisines, 
  lastMade, 
  timesCooked, 
  sourceId, 
  location, 
  compact = false,
  lastComment,
  tags = []
}: DishCardContentProps) => {
  const { navigateToTag } = useTagNavigation();

  return (
    <CardContent className={`${compact ? "pb-2 px-4" : "pb-6"} flex-grow`}>
      <div className="space-y-3">
        <CuisinesList cuisines={cuisines || []} compact={compact} />
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <TagBadge 
                key={tag} 
                tag={tag} 
                variant="outline" 
                clickable 
                onClick={() => navigateToTag(tag)}
              />
            ))}
          </div>
        )}
        
        <CookingInfo 
          lastMade={lastMade} 
          timesCooked={timesCooked || 0} 
          compact={compact} 
        />
        
        {lastComment && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground italic break-words">
              "{lastComment}"
            </p>
          </div>
        )}
        
        <SourceInfo sourceId={sourceId} location={location} />
      </div>
    </CardContent>
  );
};

export default DishCardContent;
