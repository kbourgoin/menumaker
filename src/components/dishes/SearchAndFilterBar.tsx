
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, SortAsc } from "lucide-react";
import { Source } from "@/types";

interface SearchAndFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
  sourceFilter: string;
  setSourceFilter: (sourceId: string) => void;
  sources: Source[];
  isLoadingSources: boolean;
}

const SearchAndFilterBar = ({
  searchQuery,
  setSearchQuery,
  sortOption,
  setSortOption,
  sourceFilter,
  setSourceFilter,
  sources,
  isLoadingSources
}: SearchAndFilterBarProps) => {
  return (
    <div className="grid gap-4 mb-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative col-span-full sm:col-span-1 lg:col-span-2">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by dish name or cuisine..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <div className="sm:col-span-1">
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
      </div>
      
      <div className="sm:col-span-1">
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger>
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-sources">All Sources</SelectItem>
            <SelectItem value="none">No Source</SelectItem>
            {!isLoadingSources && sources && sources.map((source: Source) => (
              <SelectItem key={source.id} value={source.id}>
                {source.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default SearchAndFilterBar;
