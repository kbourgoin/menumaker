
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

interface DishesEmptyStateProps {
  isFiltered?: boolean;
}

const DishesEmptyState = ({ isFiltered = false }: DishesEmptyStateProps) => {
  return (
    <div className="col-span-full text-center p-8 border rounded-lg">
      {isFiltered ? (
        <p className="text-muted-foreground">No dishes match your filters.</p>
      ) : (
        <>
          <p className="text-muted-foreground mb-4">
            No dishes found. Add your first dish to get started.
          </p>
          <Button asChild className="bg-terracotta-500 hover:bg-terracotta-600">
            <Link to="/add-meal">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Dish
            </Link>
          </Button>
        </>
      )}
    </div>
  );
};

export default DishesEmptyState;
