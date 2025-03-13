
import { Link, Globe, Book, FileText } from "lucide-react";
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
              url: sourceData.type === 'website' ? sourceData.location : undefined
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
  
  if (source.type === 'website' && source.url) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <a 
              href={source.url.startsWith('http') ? source.url : `https://${source.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center text-sm transition-colors text-terracotta-500 hover:text-terracotta-600 hover:underline ${className}`}
            >
              <Globe className="w-4 h-4 mr-1.5" />
              <span className="truncate max-w-[200px]">
                {source.name}
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
              {source.name}
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
