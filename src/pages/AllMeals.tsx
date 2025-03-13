
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useDishes } from "@/hooks/useDishes";
import DishCard from "@/components/dish-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const AllDishes = () => {
  const { dishes, isLoading } = useDishes();
  const [searchQuery, setSearchQuery] = useState("");
  
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
  
  // Filter dishes based on search query
  const filteredDishes = dishes?.filter(dish => 
    dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dish.cuisines.some(cuisine => 
      cuisine.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];
  
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
        
        <div className="relative mb-8">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by dish name or cuisine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
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
