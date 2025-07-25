import SortSelect from "./SortSelect";
import { OmniSearch } from "./OmniSearch";

interface SearchAndFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  viewMode?: "cards" | "table";
}

const SearchAndFilterBar = ({
  searchQuery,
  setSearchQuery,
  sortOption,
  setSortOption,
  selectedTags,
  setSelectedTags,
  viewMode = "cards",
}: SearchAndFilterBarProps) => {
  return (
    <div className="space-y-4 mb-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-full sm:col-span-1 lg:col-span-2">
          <OmniSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
          />
        </div>

        {viewMode === "cards" && (
          <div className="sm:col-span-1">
            <SortSelect sortOption={sortOption} setSortOption={setSortOption} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchAndFilterBar;
