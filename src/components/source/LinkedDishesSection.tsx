
import React from "react";
import { Dish } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { MapPin, BookOpen, ExternalLink } from "lucide-react";

interface LinkedDishesSectionProps {
  dishes: Dish[];
}

const LinkedDishesSection: React.FC<LinkedDishesSectionProps> = ({ dishes }) => {
  if (dishes.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Linked Recipes</h3>
        <p className="text-sm text-muted-foreground">No recipes linked to this source.</p>
      </div>
    );
  }

  const formatLocation = (location: string | undefined) => {
    if (!location) return null;
    
    // Check if location is a URL
    const isUrl = location.startsWith('http') || 
                  location.startsWith('www.') || 
                  location.includes('.com') || 
                  location.includes('.org') || 
                  location.includes('.net');
    
    if (isUrl) {
      const href = location.startsWith('http') ? location : `https://${location}`;
      return (
        <span className="flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-terracotta-500 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Recipe Link
          </a>
        </span>
      );
    }
    
    // Check if location is a number or contains numbers (page number)
    const hasNumbers = /\d/.test(location);
    if (hasNumbers) {
      return (
        <span className="flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          p. {location}
        </span>
      );
    }
    
    // Default case - just show the location with a map pin
    return (
      <span className="flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        {location}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Linked Recipes ({dishes.length})</h3>
      
      <ScrollArea className="h-52 w-full rounded-md border">
        <div className="p-4">
          <ul className="space-y-3">
            {dishes.map((dish) => (
              <li 
                key={dish.id} 
                className="border-b border-gray-100 pb-2 last:border-0"
              >
                <div className="font-medium">{dish.name}</div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                  {dish.location && formatLocation(dish.location)}
                  {dish.timesCooked > 0 && (
                    <span>
                      Cooked {dish.timesCooked} {dish.timesCooked === 1 ? 'time' : 'times'}
                    </span>
                  )}
                  {dish.lastMade && (
                    <span>
                      Last made: {format(new Date(dish.lastMade), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </ScrollArea>
    </div>
  );
};

export default LinkedDishesSection;
