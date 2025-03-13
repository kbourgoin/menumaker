
import { Link, Globe, Book, FileText, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { useSources } from "@/hooks/useSources";

interface SourceLinkProps {
  sourceId?: string;
  className?: string;
}

const SourceLink = ({ sourceId, className = "" }: SourceLinkProps) => {
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
  
  // For website sources, make the name a clickable external link
  if (source.type === 'website' && source.name) {
    // For websites, use the name as URL if no explicit URL is provided
    const url = source.url || source.name;
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    
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
