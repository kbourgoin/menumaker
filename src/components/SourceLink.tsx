
import { Link, Globe, Book, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { useSources } from "@/hooks/useSources";

interface SourceLinkProps {
  source: {
    type: 'url' | 'book' | 'none';
    value: string;
    page?: number;
  };
  sourceId?: string;
  className?: string;
}

const SourceLink = ({ source, sourceId, className = "" }: SourceLinkProps) => {
  const [sourceName, setSourceName] = useState<string | null>(null);
  const { getSource } = useSources();
  
  // Handle 'none' type or empty source
  if (source.type === 'none' || !source.value) {
    return null;
  }
  
  // Fetch source name if sourceId is provided
  useEffect(() => {
    if (sourceId) {
      const fetchSource = async () => {
        try {
          const sourceData = await getSource(sourceId);
          if (sourceData) {
            setSourceName(sourceData.name);
          }
        } catch (error) {
          console.error("Error fetching source:", error);
        }
      };
      
      fetchSource();
    }
  }, [sourceId, getSource]);
  
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
              {sourceName || source.value} {source.page && `(p. ${source.page})`}
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
