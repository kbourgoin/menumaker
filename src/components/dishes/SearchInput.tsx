
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchInputProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SearchInput = ({ searchQuery, setSearchQuery }: SearchInputProps) => {
  return (
    <div className="relative">
      <label htmlFor="dish-search" className="sr-only">
        Search dishes by name or cuisine
      </label>
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <Input
        id="dish-search"
        type="search"
        placeholder="Search by dish name or cuisine..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-9"
        aria-describedby="search-help"
        autoComplete="off"
      />
      <div id="search-help" className="sr-only">
        Type to search through your dishes by name or cuisine type
      </div>
    </div>
  );
};

export default SearchInput;
