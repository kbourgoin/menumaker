
import SearchInput from "./SearchInput";
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
      <div className="col-span-full sm:col-span-1 lg:col-span-2">
        <SearchInput
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
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
