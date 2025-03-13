
interface LocationDisplayProps {
  location: string;
  inline?: boolean;
}

const LocationDisplay = ({ location, inline = false }: LocationDisplayProps) => {
  console.log("LocationDisplay received location:", location);
  
  // Function to check if a string is a URL
  const isUrl = (str: string): boolean => {
    return /^(https?:\/\/|www\.)[^\s]+\.[^\s]+/i.test(str);
  };
  
  const isLocationUrl = isUrl(location);
  
  return (
    <div className={`${inline ? "" : "text-sm"} text-muted-foreground inline-flex items-center`}>
      <span>{isLocationUrl ? location : `Page: ${location}`}</span>
    </div>
  );
};

export default LocationDisplay;
