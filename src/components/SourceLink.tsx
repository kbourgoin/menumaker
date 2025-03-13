import { Link, Globe, Book, FileText, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { useSources } from "@/hooks/useSources";

interface SourceLinkProps {
  sourceId?: string;
  location?: string;
  className?: string;
}

const SourceLink = ({ sourceId, location, className = "" }: SourceLinkProps) => {
  const [source, setSource] = useState<{name: string, type: string, url?: string} | null>(null);
  const { getSource } = useSources();
  
  // Fetch source if sourceId is provided
  useEffect(() => {
    if (sourceId) {
      const fetchSource = async () => {
        try {
          const sourceData = await getSource(sourceId);
          if (sourceData) {
            setSource({
              name: sourceData.name,
              type: sourceData.type,
              url: sourceData.url
            });
          }
        } catch (error) {
          console.error("Error fetching source:", error);
        }
      };
      
      fetchSource();
    }
  }, [sourceId, getSource]);
  
  if (!source) {
    return null;
  }
  
  // Function to check if a string is likely a URL
  const isUrl = (str: string | undefined): boolean => {
    if (!str) return false;
    return /^(https?:\/\/|www\.)[^\s]+\.[^\s]+/i.test(str);
  };
  
  // For website sources, make the name a clickable external link
  if (source.type === 'website') {
    // For websites, use the location as URL if it's a URL,
    // otherwise use the source name as fallback
    let linkUrl = '';
    
    if (isUrl(location)) {
      // Use the location as the URL
      linkUrl = location!;
    } else if (isUrl(source.url)) {
      // Use the source's URL if available
      linkUrl = source.url;
    } else if (isUrl(source.name)) {
      // Use the source name as last resort if it looks like a URL
      linkUrl = source.name;
    } else {
      // Default case: use the source name but ensure it has http prefix
      linkUrl = source.name;
    }
    
    // Ensure URL has proper http prefix
    const fullUrl = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    
    return (
      <a 
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center text-sm text-terracotta-500 hover:text-terracotta-600 hover:underline ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <Globe className="w-4 h-4 mr-1.5" />
        <span className="truncate max-w-[200px]">
          {source.name}
        </span>
        <ExternalLink className="w-3.5 h-3.5 ml-1" />
      </a>
    );
  }
  
  // For non-website sources (book, document, etc.)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center text-sm text-terracotta-500 ${className}`}>
            {source.type === 'book' && <Book className="w-4 h-4 mr-1.5" />}
            {source.type === 'website' && <Globe className="w-4 h-4 mr-1.5" />}
            {source.type === 'document' && <FileText className="w-4 h-4 mr-1.5" />}
            <span className="truncate max-w-[200px]">
              {source.name}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{source.type === 'book' ? "Book reference" : 
             source.type === 'website' ? "Website reference" : 
             "Document reference"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SourceLink;
