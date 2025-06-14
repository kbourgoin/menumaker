import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useMeals } from "@/hooks/useMeals";
import { useSources } from "@/hooks/sources";
import { sortDishes } from "@/utils/dishUtils";
import {
  SearchAndFilterBar,
  ViewToggle,
  DishesLoading,
  DishesHeader,
  DishesDisplay
} from "@/components/dishes";

const AllDishes = () => {
  const { dishes, isLoading } = useMeals();
  const { sources: sourcesData } = useSources();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("lastCooked");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const getFilteredDishes = () => {
    if (!dishes || !Array.isArray(dishes)) {
      console.log("No dishes array available:", dishes);
      return [];
    }
    
    let filtered = dishes.filter(dish => {
      if (!dish || typeof dish !== 'object') {
        console.log("Invalid dish object:", dish);
        return false;
      }
      
      // Text search filter
      const matchesSearch = !searchQuery || 
        (dish.name && dish.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (dish.cuisines && Array.isArray(dish.cuisines) && dish.cuisines.some(cuisine => 
          cuisine && cuisine.toLowerCase().includes(searchQuery.toLowerCase())
        ));
      
      // Tag filter
      const matchesTags = selectedTags.length === 0 || 
        (dish.tags && selectedTags.every(selectedTag => 
          dish.tags.includes(selectedTag)
        ));
      
      return matchesSearch && matchesTags;
    });
    
    // Only sort for cards view - table view handles its own sorting
    return viewMode === "cards" ? sortDishes(filtered, sortOption) : filtered;
  };
  
  const filteredDishes = getFilteredDishes();
  
  return (
    <Layout>
      <div className="mb-8 animate-slide-down">
        <DishesHeader />
        
        <SearchAndFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortOption={sortOption}
          setSortOption={setSortOption}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          viewMode={viewMode}
        />
        
        <ViewToggle 
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
        
        {isLoading ? (
          <DishesLoading />
        ) : (
          <DishesDisplay
            dishes={dishes}
            filteredDishes={filteredDishes}
            viewMode={viewMode}
            isLoading={isLoading}
            sortOption={sortOption}
            setSortOption={setSortOption}
          />
        )}
        
        {dishes && dishes.length > 0 && (
          <div className="mt-6 text-sm text-muted-foreground">
            Showing {filteredDishes.length} of {dishes.length} dishes
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AllDishes;
