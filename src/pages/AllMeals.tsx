
import { useState } from "react";
import Layout from "@/components/Layout";
import { useMeals } from "@/hooks/useMeals";
import MealCard from "@/components/MealCard";
import { Input } from "@/components/ui/input";
import CSVImport from "@/components/CSVImport";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";

const AllMeals = () => {
  const { meals } = useMeals();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter meals based on search query
  const filteredMeals = meals.filter(meal => 
    meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meal.cuisines.some(cuisine => 
      cuisine.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  
  return (
    <Layout>
      <div className="mb-8 animate-slide-down">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
          <h1 className="text-3xl font-serif font-medium">All Meals</h1>
          <div className="flex gap-2">
            <CSVImport />
            <Button asChild className="bg-terracotta-500 hover:bg-terracotta-600">
              <Link to="/add-meal">
                <Plus className="h-4 w-4 mr-2" />
                Add Meal
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="relative mb-8">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by meal name or cuisine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMeals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
          
          {filteredMeals.length === 0 && (
            <div className="col-span-full text-center p-8 border rounded-lg">
              <p className="text-muted-foreground">
                {meals.length === 0 
                  ? "No meals found. Add your first meal or import from CSV." 
                  : "No meals match your search."}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AllMeals;
