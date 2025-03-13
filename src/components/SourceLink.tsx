
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
              type: sourceData.type
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
  
  // Book source
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
