
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { SortAsc } from "lucide-react";

interface SortSelectProps {
  sortOption: string;
  setSortOption: (option: string) => void;
}

const SortSelect = ({ sortOption, setSortOption }: SortSelectProps) => {
  return (
    <Select value={sortOption} onValueChange={setSortOption}>
      <SelectTrigger>
        <SortAsc className="h-4 w-4 mr-2" />
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
