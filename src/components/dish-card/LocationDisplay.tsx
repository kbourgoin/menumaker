interface LocationDisplayProps {
  location: string;
  inline?: boolean;
}

const LocationDisplay = ({
  location,
  inline = false,
}: LocationDisplayProps) => {
  // Function to check if a string is a URL
  const isUrl = (str: string): boolean => {
    return /^(https?:\/\/|www\.)[^\s]+\.[^\s]+/i.test(str);
  };

  const isLocationUrl = isUrl(location);

  return (
    <div
      className={`${inline ? "" : "text-sm"} inline-flex items-center text-terracotta-500`}
    >
      <span>{isLocationUrl ? location : `p. ${location}`}</span>
    </div>
  );
};

export default LocationDisplay;
