
import { Link, Globe, Book, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { useSources } from "@/hooks/sources";

interface SourceLinkProps {
  sourceId?: string;
  location?: string;
  className?: string;
}

const SourceLink = ({ sourceId, location, className = "" }: SourceLinkProps) => {
  const [source, setSource] = useState<{name: string, type: string, url?: string} | null>(null);
  const { getSource } = useSources();
  
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
  
  const isUrl = (str: string | undefined): boolean => {
    if (!str) return false;
    return /^(https?:\/\/|www\.)[^\s]+\.[^\s]+/i.test(str);
  };
  
  if (source.type === 'website') {
    let linkUrl = '';
    
    if (isUrl(location)) {
      linkUrl = location!;
    } else if (isUrl(source.url)) {
      linkUrl = source.url;
    } else if (isUrl(source.name)) {
      linkUrl = source.name;
    } else {
      linkUrl = source.name;
    }
    
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
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center text-sm text-terracotta-500 ${className}`}>
            {source.type === 'book' && <Book className="w-4 h-4 mr-1.5" />}
            {source.type === 'website' && <Globe className="w-4 h-4 mr-1.5" />}
            <span className="truncate max-w-[200px]">
              {source.name}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{source.type === 'book' ? "Book reference" : "Website reference"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SourceLink;
