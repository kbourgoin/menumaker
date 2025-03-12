
import { Link, Globe, Book } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getCookbookById } from "@/utils/mealUtils";
import { useEffect, useState } from "react";

interface SourceLinkProps {
  source: {
    type: 'url' | 'book' | 'none';
    value: string;
    page?: number;
    bookId?: string;
  };
  className?: string;
}

const SourceLink = ({ source, className = "" }: SourceLinkProps) => {
  const [cookbookName, setCookbookName] = useState<string | null>(null);
  
  // Handle 'none' type or empty source
  if (source.type === 'none' || !source.value) {
    return null;
  }
  
  // Fetch cookbook name if bookId is provided
  useEffect(() => {
    if (source.type === 'book' && source.bookId) {
      const cookbook = getCookbookById(source.bookId);
      if (cookbook) {
        setCookbookName(cookbook.name);
      }
    }
  }, [source.bookId, source.type]);
  
  if (source.type === 'url') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a 
              href={source.value.startsWith('http') ? source.value : `https://${source.value}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center text-sm transition-colors text-terracotta-500 hover:text-terracotta-600 hover:underline ${className}`}
            >
              <Globe className="w-4 h-4 mr-1.5" />
              <span className="truncate max-w-[200px]">
                {source.value.replace(/^https?:\/\//, '').replace(/^www\./, '')}
              </span>
            </a>
          </TooltipTrigger>
          <TooltipContent>
            <p>View recipe online</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Book source
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center text-sm text-terracotta-500 ${className}`}>
            <Book className="w-4 h-4 mr-1.5" />
            <span className="truncate max-w-[200px]">
              {cookbookName || source.value} {source.page && `(p. ${source.page})`}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Book reference</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SourceLink;
