
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import SortSelect from "./SortSelect";

interface SearchAndFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
  viewMode?: "cards" | "table";
}

const SearchAndFilterBar = ({
  searchQuery,
  setSearchQuery,
  sortOption,
  setSortOption,
  viewMode = "cards",
}: SearchAndFilterBarProps) => {
  return (
    <div className="grid gap-4 mb-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <div className="relative col-span-full sm:col-span-1 lg:col-span-2">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by dish name or cuisine..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {viewMode === "cards" && (
        <div className="sm:col-span-1">
          <SortSelect 
            sortOption={sortOption} 
            setSortOption={setSortOption} 
          />
        </div>
      )}
    </div>
  );
};

export default SearchAndFilterBar;
