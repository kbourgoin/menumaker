import { SourceLink } from "@/components/shared";
import LocationDisplay from "./LocationDisplay";

interface SourceInfoProps {
  sourceId?: string;
  sourceName?: string; // New prop to receive source name directly
  sourceType?: string; // New prop to receive source type directly
  sourceUrl?: string; // New prop to receive source URL directly
  location?: string;
}

const SourceInfo = ({
  sourceId,
  sourceName,
  sourceType,
  sourceUrl,
  location,
}: SourceInfoProps) => {
  // If there's no sourceId and no location, don't render anything
  if (!sourceId && !location) {
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
      {sourceId && (
        <SourceLink
          sourceId={sourceId}
          sourceName={sourceName}
          sourceType={sourceType}
          sourceUrl={sourceUrl}
          location={location}
        />
      )}
      {!sourceId && location && !isLocationUrl && (
        <LocationDisplay location={location} inline={true} />
      )}
    </div>
  );
};

export default SourceInfo;
