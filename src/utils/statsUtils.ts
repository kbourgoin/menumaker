import { Dish } from "@/types";

// Mock functions that were previously imported from dishUtils
const getDishes = (): Dish[] => [];
const getDishById = (id: string): Dish | undefined => undefined;

// Mock function for getMealHistory
const getMealHistory = (): {
  date: string;
  dishId: string;
  notes?: string;
}[] => [];

// Get stats about dishes
export const getDishStats = () => {
  const dishes = getDishes();
  const history = getMealHistory();

  return {
    totalDishes: dishes.length,
    totalTimesCooked: dishes.reduce((sum, dish) => sum + dish.timesCooked, 0),
    mostCooked: [...dishes].sort((a, b) => b.timesCooked - a.timesCooked)[0],
    cuisineBreakdown: dishes.reduce(
      (acc: Record<string, number>, dish) => {
        dish.cuisines.forEach(cuisine => {
          acc[cuisine] = (acc[cuisine] || 0) + 1;
        });
        return acc;
      },
      {} as Record<string, number>
    ),
    recentlyCooked: history
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(h => ({
        date: h.date,
        dish: getDishById(h.dishId),
      })),
  };
};
