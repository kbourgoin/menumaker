
import { Dish } from "@/types";
import DishCard from "@/components/dish-card";
import DishTable from "@/components/dish-table";
import DishesEmptyState from "./DishesEmptyState";

interface DishesDisplayProps {
  dishes: Dish[] | null;
  filteredDishes: Dish[];
  viewMode: "cards" | "table";
  isLoading: boolean;
}

const DishesDisplay = ({ 
  dishes, 
  filteredDishes, 
  viewMode,
  isLoading
}: DishesDisplayProps) => {
  if (isLoading) {
    return null;
  }

  if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
    return <DishesEmptyState />;
  }

  if (filteredDishes.length === 0) {
    return <DishesEmptyState isFiltered={true} />;
  }

  return (
    <>
      {viewMode === "cards" ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDishes.map((dish: Dish) => (
            <DishCard 
              key={dish.id} 
              dish={dish} 
            />
          ))}
        </div>
      ) : (
        <DishTable dishes={filteredDishes} />
      )}
    </>
  );
};

export default DishesDisplay;
