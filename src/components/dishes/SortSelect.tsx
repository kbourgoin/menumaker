import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortAsc, SortDesc } from "lucide-react";
import { useEffect, useState } from "react";

interface SortSelectProps {
  sortOption: string;
  setSortOption: (option: string) => void;
}

const SortSelect = ({ sortOption, setSortOption }: SortSelectProps) => {
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  // Extract the base sort option without any asc_ prefix
  const baseSortOption = sortOption.replace(/^asc_/, "");

  // Handle selection changes
  const handleSortChange = (newOption: string) => {
    // If selecting the same option that's currently active, toggle direction
    if (newOption === baseSortOption) {
      const newDirection = direction === "asc" ? "desc" : "asc";
      setDirection(newDirection);

      // Apply direction to the sort option
      setSortOption(newDirection === "asc" ? `asc_${newOption}` : newOption);
    } else {
      // If selecting a different option, use the current direction
      setSortOption(direction === "asc" ? `asc_${newOption}` : newOption);
    }
  };

  // Update the local direction state when sortOption changes externally
  useEffect(() => {
    if (sortOption.startsWith("asc_")) {
      setDirection("asc");
    } else {
      setDirection("desc");
    }
  }, [sortOption]);

  return (
    <Select value={baseSortOption} onValueChange={handleSortChange}>
      <SelectTrigger>
        {direction === "asc" ? (
          <SortAsc className="h-4 w-4 mr-2" />
        ) : (
          <SortDesc className="h-4 w-4 mr-2" />
        )}
        <SelectValue placeholder="Sort by last cooked" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="name">Name (A-Z)</SelectItem>
        <SelectItem value="lastCooked">Last Cooked</SelectItem>
        <SelectItem value="timesCooked">Times Cooked</SelectItem>
        <SelectItem value="cuisine">Cuisine</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default SortSelect;
