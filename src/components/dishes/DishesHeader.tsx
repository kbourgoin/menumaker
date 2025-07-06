import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

const DishesHeader = () => {
  return (
    <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
      <h1 className="text-3xl font-serif font-medium">All Dishes</h1>
      <Button asChild className="bg-terracotta-500 hover:bg-terracotta-600">
        <Link to="/add-meal">
          <Plus className="h-4 w-4 mr-2" />
          Add Dish
        </Link>
      </Button>
    </div>
  );
};

export default DishesHeader;
