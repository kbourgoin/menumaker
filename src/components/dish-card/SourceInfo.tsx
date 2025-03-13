
import SourceLink from "../SourceLink";
import LocationDisplay from "./LocationDisplay";

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
  
  return (
    <div className="mt-2 flex items-center gap-2">
      {sourceId && <SourceLink sourceId={sourceId} location={location} />}
      {sourceId && location && <span className="text-gray-300">•</span>}
      {location && <LocationDisplay location={location} inline={true} />}
    </div>
  );
};

export default SourceInfo;
