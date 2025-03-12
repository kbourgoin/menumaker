
import { useState } from "react";
import Layout from "@/components/Layout";
import { useDishes } from "@/hooks/useMeals";
import DishCard from "@/components/MealCard";
import { Input } from "@/components/ui/input";
import CSVImport from "@/components/CSVImport";
import { ClearDataDialog } from "@/components/ClearDataDialog";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";

const AllDishes = () => {
  const { dishes } = useDishes();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter dishes based on search query
  const filteredDishes = dishes.filter(dish => 
    dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dish.cuisines.some(cuisine => 
      cuisine.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  
  return (
    <Layout>
      <div className="mb-8 animate-slide-down">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
          <h1 className="text-3xl font-serif font-medium">All Dishes</h1>
          <div className="flex gap-2">
            <CSVImport />
            <ClearDataDialog />
            <Button asChild className="bg-terracotta-500 hover:bg-terracotta-600">
              <Link to="/add-meal">
                <Plus className="h-4 w-4 mr-2" />
                Add Dish
              </Link>
            </Button>
          </div>
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
          {filteredDishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
          
          {filteredDishes.length === 0 && (
            <div className="col-span-full text-center p-8 border rounded-lg">
              <p className="text-muted-foreground">
                {dishes.length === 0 
                  ? "No dishes found. Add your first dish or import from CSV." 
                  : "No dishes match your search."}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AllDishes;
