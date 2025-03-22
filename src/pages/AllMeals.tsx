
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
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  
  const processedDishes = () => {
    if (!dishes || !Array.isArray(dishes)) {
      console.log("No dishes array available:", dishes);
      return [];
    }
    
    let filtered = dishes.filter(dish => {
      // Safety check for valid dish objects
      if (!dish || typeof dish !== 'object') {
        console.log("Invalid dish object:", dish);
        return false;
      }
      
      return !searchQuery || 
        (dish.name && dish.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (dish.cuisines && Array.isArray(dish.cuisines) && dish.cuisines.some(cuisine => 
          cuisine && cuisine.toLowerCase().includes(searchQuery.toLowerCase())
        ));
    });
    
    return sortDishes(filtered, sortOption);
  };
  
  const filteredDishes = processedDishes();
  
  return (
    <Layout>
      <div className="mb-8 animate-slide-down">
        <DishesHeader />
        
        <SearchAndFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortOption={sortOption}
          setSortOption={setSortOption}
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
