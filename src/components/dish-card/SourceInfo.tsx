
import SourceLink from "../SourceLink";
import LocationDisplay from "./LocationDisplay";
import { cn } from "@/lib/utils";

interface SourceInfoProps {
  sourceId?: string;
  location?: string;
}

const SourceInfo = ({ sourceId, location }: SourceInfoProps) => {
  console.log("SourceInfo received:", { sourceId, location });
  
  if (!sourceId && !location) {
    console.log("SourceInfo returning null - no data");
    return null;
  }
  
  // Function to check if a string is a URL
  const isUrl = (str: string | undefined): boolean => {
    if (!str) return false;
    return /^(https?:\/\/|www\.)[^\s]+\.[^\s]+/i.test(str);
  };
  
  const isLocationUrl = location ? isUrl(location) : false;
  
  return (
    <div className="mt-2 flex items-center gap-1">
      {sourceId && <SourceLink sourceId={sourceId} location={location} />}
      {sourceId && location && !isLocationUrl && <span className="text-terracotta-500">&nbsp;p.&nbsp;{location}</span>}
      {!sourceId && location && !isLocationUrl && <LocationDisplay location={location} inline={true} />}
    </div>
  );
};

export default SourceInfo;
