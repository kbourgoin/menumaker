
interface LocationDisplayProps {
  location: string;
  inline?: boolean;
}

const LocationDisplay = ({ location, inline = false }: LocationDisplayProps) => {
  console.log("LocationDisplay received location:", location);
  
  return (
    <div className={`${inline ? "" : "text-sm"} text-muted-foreground inline-flex items-center`}>
      <span>Page: {location}</span>
    </div>
  );
};

export default LocationDisplay;
