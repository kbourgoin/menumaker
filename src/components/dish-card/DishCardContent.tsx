
import { CardContent } from "@/components/ui/card";
import CuisinesList from "./CuisinesList";
import CookingInfo from "./CookingInfo";
import SourceInfo from "./SourceInfo";
import { TagBadge } from "@/components/tags";
import { useTagNavigation } from "@/hooks/useTagNavigation";
import { CUISINES } from "@/components/dish-form/constants";

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

  // Filter out cuisine tags from the general tags display
  // Cuisine tags are handled separately in CuisinesList
  const knownCuisines = new Set(CUISINES);
  const generalTags = tags?.filter(tag => !knownCuisines.has(tag)) || [];

  return (
    <CardContent className={`${compact ? "pb-2 px-4" : "pb-6"} flex-grow`}>
      <div className="space-y-3">
        <CuisinesList cuisines={cuisines || []} compact={compact} />
        
        {generalTags && generalTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {generalTags.map((tag) => (
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
