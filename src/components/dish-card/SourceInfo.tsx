
import SourceLink from "../SourceLink";
import LocationDisplay from "./LocationDisplay";

interface SourceInfoProps {
  sourceId?: string;
  location?: string;
}

const SourceInfo = ({ sourceId, location }: SourceInfoProps) => {
  if (!sourceId && !location) return null;
  
  return (
    <div className="mt-2 space-y-1">
      {sourceId && <SourceLink sourceId={sourceId} />}
      {location && <LocationDisplay location={location} />}
    </div>
  );
};

export default SourceInfo;
