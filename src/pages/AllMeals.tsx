
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useDishes } from "@/hooks/useDishes";
import { useSources } from "@/hooks/useSources";
import DishCard from "@/components/dish-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Plus, Search, SortAsc } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { sortDishes } from "@/utils/dishUtils";

const AllDishes = () => {
  const { dishes, isLoading } = useDishes();
  const { getSources } = useSources();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("name");
  const [sourceFilter, setSourceFilter] = useState("");
  const [sources, setSources] = useState<any[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  
  // Load sources
  useEffect(() => {
    const loadSources = async () => {
      try {
        const sourcesData = await getSources();
        setSources(sourcesData);
      } catch (error) {
        console.error("Error loading sources:", error);
      } finally {
        setIsLoadingSources(false);
      }
    };
    
    loadSources();
  }, [getSources]);
  
  // Log dishes when they load
  useEffect(() => {
    if (dishes && dishes.length > 0) {
      console.log("Dishes loaded in AllMeals:", dishes);
      // Check for source and location in the first few dishes
      dishes.slice(0, 3).forEach((dish, index) => {
        console.log(`Dish ${index} details:`, {
          name: dish.name,
          sourceId: dish.sourceId,
          location: dish.location
        });
      });
    }
  }, [dishes]);
  
  // Apply sorting and filtering
  const processedDishes = () => {
    if (!dishes) return [];
    
    // First filter by search query and source
    let filtered = dishes.filter(dish => {
      // Apply text search filter
      const matchesSearch = !searchQuery || 
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.cuisines.some(cuisine => 
          cuisine.toLowerCase().includes(searchQuery.toLowerCase())
        );
      
      // Apply source filter
      const matchesSource = !sourceFilter || dish.sourceId === sourceFilter;
      
      return matchesSearch && matchesSource;
    });
    
    // Then sort the filtered results
    return sortDishes(filtered, sortOption);
  };
  
  const filteredDishes = processedDishes();
  
  // Create loading skeletons for dishes
  const LoadingSkeletons = () => (
    <>
      {Array(8).fill(0).map((_, index) => (
        <div key={`skeleton-${index}`} className="rounded-lg border overflow-hidden">
          <div className="p-6">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="border-t p-4">
            <div className="flex justify-between">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
  
  return (
    <Layout>
      <div className="mb-8 animate-slide-down">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
          <h1 className="text-3xl font-serif font-medium">All Dishes</h1>
          <Button asChild className="bg-terracotta-500 hover:bg-terracotta-600">
            <Link to="/add-meal">
              <Plus className="h-4 w-4 mr-2" />
              Add Dish
            </Link>
          </Button>
        </div>
        
        <div className="grid gap-4 mb-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search bar */}
          <div className="relative col-span-full sm:col-span-1 lg:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by dish name or cuisine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Sort dropdown */}
          <div className="sm:col-span-1">
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger>
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="lastCooked">Last Cooked</SelectItem>
                <SelectItem value="timesCooked">Times Cooked</SelectItem>
                <SelectItem value="cuisine">Cuisine</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Source filter */}
          <div className="sm:col-span-1">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-sources">All Sources</SelectItem>
                <SelectItem value="none">No Source</SelectItem>
                {!isLoadingSources && sources.map(source => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading && dishes === undefined ? (
            <LoadingSkeletons />
          ) : (
            <>
              {dishes && dishes.length > 0 ? (
                filteredDishes.length > 0 ? (
                  filteredDishes.map((dish) => (
                    <DishCard 
                      key={dish.id} 
                      dish={dish} 
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 border rounded-lg">
                    <p className="text-muted-foreground">No dishes match your filters.</p>
                  </div>
                )
              ) : (
                <div className="col-span-full text-center p-8 border rounded-lg">
                  <p className="text-muted-foreground mb-4">
                    No dishes found. Add your first dish to get started.
                  </p>
                  <Button asChild className="bg-terracotta-500 hover:bg-terracotta-600">
                    <Link to="/add-meal">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Dish
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Results count */}
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
