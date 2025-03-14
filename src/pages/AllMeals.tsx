import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useDishes } from "@/hooks/useDishes";
import { useSources } from "@/hooks/useSources";
import DishCard from "@/components/dish-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Search, 
  ArrowUpDown, 
  Edit, 
  X, 
  Check
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Dish, Source } from "@/types";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { sortDishes } from "@/utils/dishUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import BulkEditDialog from "@/components/dish-card/BulkEditDialog";

const AllDishes = () => {
  const { dishes, isLoading, updateDish } = useDishes();
  const { getSources } = useSources();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [filterSource, setFilterSource] = useState<string>("");
  const [filterCuisine, setFilterCuisine] = useState<string>("");
  const [selectedDishes, setSelectedDishes] = useState<Set<string>>(new Set());
  const [sources, setSources] = useState<Source[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [availableCuisines, setAvailableCuisines] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Load sources for filtering
  useEffect(() => {
    const loadSources = async () => {
      const sourcesData = await getSources();
      setSources(sourcesData);
    };
    loadSources();
  }, [getSources]);
  
  // Extract unique cuisines from dishes for filtering
  useEffect(() => {
    if (dishes && dishes.length > 0) {
      const cuisines = new Set<string>();
      dishes.forEach(dish => {
        dish.cuisines.forEach(cuisine => cuisines.add(cuisine));
      });
      setAvailableCuisines(Array.from(cuisines).sort());
    }
  }, [dishes]);
  
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
  
  // Toggle selection mode
  const toggleSelectMode = () => {
    if (isSelectMode) {
      // Clear selections when exiting select mode
      setSelectedDishes(new Set());
    }
    setIsSelectMode(!isSelectMode);
  };
  
  // Toggle dish selection
  const toggleDishSelection = (dishId: string) => {
    const newSelection = new Set(selectedDishes);
    if (newSelection.has(dishId)) {
      newSelection.delete(dishId);
    } else {
      newSelection.add(dishId);
    }
    setSelectedDishes(newSelection);
  };
  
  // Select all dishes
  const selectAllDishes = () => {
    if (filteredDishes.length === selectedDishes.size) {
      // If all are selected, deselect all
      setSelectedDishes(new Set());
    } else {
      // Otherwise, select all
      const allIds = new Set(filteredDishes.map(dish => dish.id));
      setSelectedDishes(allIds);
    }
  };
  
  // Handle the bulk edit completion
  const handleBulkEditComplete = (changes: { cuisines?: string[], sourceId?: string }) => {
    const updatePromises = Array.from(selectedDishes).map(dishId => {
      return updateDish(dishId, changes);
    });
    
    Promise.all(updatePromises)
      .then(() => {
        toast({
          title: "Bulk update successful",
          description: `Updated ${selectedDishes.size} dishes.`,
        });
        setIsSelectMode(false);
        setSelectedDishes(new Set());
        setIsEditDialogOpen(false);
      })
      .catch(error => {
        console.error("Bulk update failed:", error);
        toast({
          title: "Bulk update failed",
          description: "An error occurred while updating dishes.",
          variant: "destructive",
        });
      });
  };
  
  // Filter dishes based on search query, source, and cuisine
  const getFilteredDishes = () => {
    if (!dishes) return [];
    
    return dishes.filter(dish => {
      // Search query filter
      const matchesSearch = searchQuery === "" || 
        dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dish.cuisines.some(cuisine => cuisine.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Source filter
      const matchesSource = filterSource === "" || dish.sourceId === filterSource;
      
      // Cuisine filter
      const matchesCuisine = filterCuisine === "" || 
        dish.cuisines.includes(filterCuisine);
      
      return matchesSearch && matchesSource && matchesCuisine;
    });
  };
  
  // Get sorted and filtered dishes
  const filteredDishes = sortDishes(getFilteredDishes(), sortBy);
  
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
          <div className="flex gap-2">
            {isSelectMode ? (
              <>
                <Button 
                  onClick={toggleSelectMode} 
                  variant="outline" 
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  onClick={selectAllDishes} 
                  variant="outline"
                  className="gap-2"
                >
                  {selectedDishes.size === filteredDishes.length ? (
                    <>
                      <X className="h-4 w-4" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Select All
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => setIsEditDialogOpen(true)} 
                  variant="default" 
                  className="gap-2"
                  disabled={selectedDishes.size === 0}
                >
                  <Edit className="h-4 w-4" />
                  Edit {selectedDishes.size} selected
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={toggleSelectMode} 
                  variant="outline" 
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Select
                </Button>
                <Button asChild className="bg-terracotta-500 hover:bg-terracotta-600 gap-2">
                  <Link to="/add-meal">
                    <Plus className="h-4 w-4" />
                    Add Dish
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by dish name or cuisine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm whitespace-nowrap">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="lastCooked">Last Cooked</SelectItem>
                    <SelectItem value="timesCooked">Times Cooked</SelectItem>
                    <SelectItem value="cuisine">Cuisine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm whitespace-nowrap">Source:</span>
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All sources</SelectItem>
                    {sources.map(source => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm whitespace-nowrap">Cuisine:</span>
                <Select value={filterCuisine} onValueChange={setFilterCuisine}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All cuisines" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All cuisines</SelectItem>
                    {availableCuisines.map(cuisine => (
                      <SelectItem key={cuisine} value={cuisine}>
                        {cuisine}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {filteredDishes.length} dish{filteredDishes.length !== 1 ? 'es' : ''} found
          </div>
        </div>
        
        {isEditDialogOpen && (
          <BulkEditDialog
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            onSave={handleBulkEditComplete}
            sources={sources}
            availableCuisines={availableCuisines}
            count={selectedDishes.size}
          />
        )}
        
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading && dishes === undefined ? (
            <LoadingSkeletons />
          ) : (
            <>
              {dishes && dishes.length > 0 ? (
                filteredDishes.length > 0 ? (
                  filteredDishes.map((dish) => (
                    <div key={dish.id} className="relative group">
                      {isSelectMode && (
                        <div className="absolute top-3 left-3 z-10">
                          <Checkbox 
                            checked={selectedDishes.has(dish.id)}
                            onCheckedChange={() => toggleDishSelection(dish.id)}
                            className="h-5 w-5 bg-white border-gray-400"
                          />
                        </div>
                      )}
                      <DishCard 
                        dish={dish} 
                        showActions={!isSelectMode}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 border rounded-lg">
                    <p className="text-muted-foreground">No dishes match your search.</p>
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
      </div>
    </Layout>
  );
};

export default AllDishes;
