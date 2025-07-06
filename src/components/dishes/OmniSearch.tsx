import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, X, Hash, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTagQueries } from "@/hooks/tags";
import { TagBadge } from "@/components/tags";
import { CUISINES } from "@/components/dish-form/constants";
import { CuisineTag } from "@/components/shared";

interface OmniSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  className?: string;
}

interface SuggestionItem {
  id: string;
  name: string;
  type: 'tag' | 'cuisine';
  description?: string;
}

export const OmniSearch = ({
  searchQuery,
  setSearchQuery,
  selectedTags,
  setSelectedTags,
  className,
}: OmniSearchProps) => {
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showInlineSuggestions, setShowInlineSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { useGeneralTags } = useTagQueries();
  const { data: availableTags = [] } = useGeneralTags();

  // Get matching suggestions (both tags and cuisines) based on current search query
  const getMatchingSuggestions = (): SuggestionItem[] => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    const suggestions: SuggestionItem[] = [];
    
    // Add matching general tags
    const matchingTags = availableTags
      .filter(tag => 
        !selectedTags.includes(tag.name) && 
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(tag => ({
        id: `tag-${tag.id}`,
        name: tag.name,
        type: 'tag' as const,
        description: tag.description
      }));
    
    // Add matching cuisines
    const matchingCuisines = CUISINES
      .filter(cuisine => 
        !selectedTags.includes(cuisine) && 
        cuisine.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(cuisine => ({
        id: `cuisine-${cuisine}`,
        name: cuisine,
        type: 'cuisine' as const
      }));
    
    // Combine and sort by relevance (exact matches first)
    suggestions.push(...matchingTags, ...matchingCuisines);
    suggestions.sort((a, b) => {
      const aExact = a.name.toLowerCase().startsWith(searchQuery.toLowerCase());
      const bExact = b.name.toLowerCase().startsWith(searchQuery.toLowerCase());
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return suggestions.slice(0, 6); // Limit to 6 suggestions
  };

  const matchingSuggestions = getMatchingSuggestions();

  // Utility to detect if we're on a mobile device
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (window.innerWidth <= 768);
  };

  const handleTagSelect = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
    setSearchQuery(""); // Clear search when selecting a tag
    setShowTagSuggestions(false);
    setShowInlineSuggestions(false);
    
    // On mobile, blur the input to close the keyboard
    // On desktop, keep focus for better UX
    if (isMobile()) {
      inputRef.current?.blur();
    } else {
      inputRef.current?.focus();
    }
  };

  const handleTagRemove = (tagName: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tagName));
  };

  const handleClearAll = () => {
    setSearchQuery("");
    setSelectedTags([]);
    // On mobile, blur input to close keyboard when clearing all
    if (isMobile()) {
      inputRef.current?.blur();
    }
  };

  const handleSearchSubmit = () => {
    // On mobile, blur input to close keyboard when submitting search
    // This makes pressing the magnifying glass Enter key close the keyboard
    if (isMobile()) {
      inputRef.current?.blur();
    }
    // Hide any open suggestions since user is "submitting" search
    setShowInlineSuggestions(false);
    setShowTagSuggestions(false);
  };

  const hasFilters = searchQuery.length > 0 || selectedTags.length > 0;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main search input with integrated tag suggestions */}
      <div className="relative">
        <label htmlFor="omni-search" className="sr-only">
          Search dishes by name, cuisine, or add tags for filtering
        </label>
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          ref={inputRef}
          id="omni-search"
          type="search"
          placeholder="Search dishes..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowInlineSuggestions(true);
          }}
          onFocus={() => {
            setInputFocused(true);
            if (matchingSuggestions.length > 0) setShowInlineSuggestions(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setInputFocused(false);
              setShowInlineSuggestions(false);
            }, 200);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearchSubmit();
            }
          }}
          className="pl-9 pr-20"
          aria-describedby="omni-search-help"
          autoComplete="off"
        />
        
        {/* Quick action buttons */}
        <div className="absolute right-2 top-2 flex items-center gap-1">
          <Popover open={showTagSuggestions} onOpenChange={setShowTagSuggestions}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title="Add tags"
              >
                <Hash className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <Command>
                <CommandInput placeholder="Search tags..." />
                <CommandList>
                  <CommandEmpty>No tags found.</CommandEmpty>
                  <CommandGroup>
                    {availableTags
                      .filter(tag => !selectedTags.includes(tag.name))
                      .map((tag) => (
                        <CommandItem
                          key={tag.id}
                          value={tag.name}
                          onSelect={() => handleTagSelect(tag.name)}
                        >
                          <Hash className="mr-2 h-3 w-3" />
                          {tag.name}
                          {tag.description && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              {tag.description}
                            </span>
                          )}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-6 w-6 p-0"
              title="Clear all"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <div id="omni-search-help" className="sr-only">
          Type to search through your dishes by name or cuisine. Use the # button to add tags for filtering.
        </div>
        
        {/* Inline suggestions */}
        {showInlineSuggestions && matchingSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <div className="p-2">
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Search className="h-3 w-3" />
                <span>Add as filter:</span>
              </div>
              <div className="space-y-1">
                {matchingSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleTagSelect(suggestion.name)}
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 flex items-center gap-2"
                  >
                    {suggestion.type === 'cuisine' ? (
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200 flex-shrink-0" />
                        <span>{suggestion.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">cuisine</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <Hash className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span>{suggestion.name}</span>
                        {suggestion.description && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {suggestion.description}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active filters display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="h-3 w-3" />
            <span>Filters:</span>
          </div>
          {selectedTags.map((tag) => {
            const isCuisine = CUISINES.includes(tag);
            return isCuisine ? (
              <div key={tag} className="relative">
                <CuisineTag 
                  cuisine={tag}
                  size="sm"
                />
                <button
                  onClick={() => handleTagRemove(tag)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                  title={`Remove ${tag} filter`}
                >
                  <X className="h-2 w-2" />
                </button>
              </div>
            ) : (
              <TagBadge
                key={tag}
                tag={tag}
                variant="default"
                removable
                onRemove={() => handleTagRemove(tag)}
                className="text-xs"
              />
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTags([])}
            className="h-5 px-2 text-xs"
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Search suggestions helper */}
      {inputFocused && searchQuery.length === 0 && selectedTags.length === 0 && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2">
          <div className="flex items-center gap-4">
            <span>💡 Tips:</span>
            <span>Search by dish name or cuisine</span>
            <span>Click <Hash className="inline h-3 w-3 mx-1" /> to add tags</span>
          </div>
        </div>
      )}
    </div>
  );
};