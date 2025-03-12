
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import MealCard from "@/components/MealCard";
import { useMeals } from "@/hooks/useMeals";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CuisineType, Meal } from "@/types";
import { Search, Plus, BookOpen } from "lucide-react";
import CuisineTag from "@/components/CuisineTag";

const AllMeals = () => {
  const { meals, isLoading } = useMeals();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);
  
  // Get unique cuisines from all meals
  const uniqueCuisines = [...new Set(meals.flatMap(meal => meal.cuisines))].sort();
  
  useEffect(() => {
    if (!isLoading) {
      let filtered = [...meals];
      
      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(meal => 
          meal.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply cuisine filter
      if (selectedCuisine !== "all") {
        filtered = filtered.filter(meal => 
          meal.cuisines.includes(selectedCuisine)
        );
      }
      
      // Apply sorting
      switch (sortBy) {
        case "name-asc":
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "name-desc":
          filtered.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case "recent":
          filtered.sort((a, b) => {
            // Handle null lastMade dates
            if (!a.lastMade && !b.lastMade) return 0;
            if (!a.lastMade) return 1;
            if (!b.lastMade) return -1;
            return new Date(b.lastMade).getTime() - new Date(a.lastMade).getTime();
          });
          break;
        case "oldest":
          filtered.sort((a, b) => {
            // Handle null lastMade dates
            if (!a.lastMade && !b.lastMade) return 0;
            if (!a.lastMade) return 1;
            if (!b.lastMade) return -1;
            return new Date(a.lastMade).getTime() - new Date(b.lastMade).getTime();
          });
          break;
        case "most-cooked":
          filtered.sort((a, b) => b.timesCooked - a.timesCooked);
          break;
        case "least-cooked":
          filtered.sort((a, b) => a.timesCooked - b.timesCooked);
          break;
        default:
          break;
      }
      
      setFilteredMeals(filtered);
    }
  }, [meals, searchTerm, selectedCuisine, sortBy, isLoading]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleCuisineChange = (value: string) => {
    setSelectedCuisine(value);
  };
  
  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 animate-slide-down">
          <div>
            <h1 className="text-3xl font-serif font-medium mb-2">All Meals</h1>
            <p className="text-muted-foreground">
              Browse and search through your meal collection
            </p>
          </div>
          
          <Link to="/add-meal" className="mt-4 md:mt-0">
            <Button className="bg-terracotta-500 hover:bg-terracotta-600">
              <Plus className="mr-2 h-4 w-4" />
              Add New Meal
            </Button>
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search meals..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCuisine} onValueChange={handleCuisineChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by cuisine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cuisines</SelectItem>
                {uniqueCuisines.map(cuisine => (
                  <SelectItem key={cuisine} value={cuisine}>
                    {cuisine}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="recent">Recently Cooked</SelectItem>
                <SelectItem value="oldest">Oldest Cooked</SelectItem>
                <SelectItem value="most-cooked">Most Cooked</SelectItem>
                <SelectItem value="least-cooked">Least Cooked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {selectedCuisine !== "all" && (
            <div className="mt-3 flex items-center">
              <span className="text-sm text-muted-foreground mr-2">Filtered by:</span>
              <CuisineTag cuisine={selectedCuisine} size="sm" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 h-7 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedCuisine("all")}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="animate-pulse text-lg">Loading meals...</div>
          </div>
        ) : filteredMeals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
            {filteredMeals.map(meal => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground animate-fade-in">
            <BookOpen className="mx-auto h-12 w-12 mb-4 text-muted-foreground opacity-20" />
            
            {meals.length === 0 ? (
              <>
                <h3 className="text-lg font-medium mb-1">No meals added yet</h3>
                <p>Start your collection by adding your favorite family meals.</p>
                <Link to="/add-meal" className="mt-4 inline-block">
                  <Button className="bg-terracotta-500 hover:bg-terracotta-600 mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Meal
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-1">No meals match your search</h3>
                <p>Try adjusting your search criteria or filters.</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCuisine("all");
                  }}
                  className="mt-4"
                >
                  Clear All Filters
                </Button>
              </>
            )}
          </div>
        )}
        
        {filteredMeals.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Showing {filteredMeals.length} of {meals.length} meals
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AllMeals;
