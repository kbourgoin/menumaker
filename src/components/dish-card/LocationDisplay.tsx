
import { ExternalLink } from "lucide-react";

interface LocationDisplayProps {
  location?: string;
}

const LocationDisplay = ({ location }: LocationDisplayProps) => {
  if (!location) return null;
  
  const isUrl = location.startsWith('http') || 
                location.startsWith('www.') || 
                location.includes('.com') || 
                location.includes('.org') || 
                location.includes('.net');
  
  if (isUrl) {
    const href = location.startsWith('http') 
      ? location 
      : `https://${location}`;
      
    return (
      <div className="mt-1 text-sm">
        <a 
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-terracotta-500 hover:text-terracotta-600 hover:underline inline-flex items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3.5 h-3.5 mr-1" />
          <span className="truncate">Recipe Link</span>
        </a>
      </div>
    );
  }
  
  return (
    <div className="mt-1 text-sm text-muted-foreground">
      <span>Page: {location}</span>
    </div>
  );
};

export default LocationDisplay;
