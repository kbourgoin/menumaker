import { useQuery } from "@tanstack/react-query";
import { supabase, mapDishFromDB } from "@/integrations/supabase/client";
import { Dish } from "@/types";

export function useMealHistoryByDate() {
  // Get meal history with dish data for dashboard
  const { data: mealHistoryWithDishes = [], isLoading } = useQuery({
    queryKey: ['mealHistoryByDate'],
    queryFn: async () => {
      try {
        // Fetch meal history with dishes joined
        const { data: historyData, error } = await supabase
          .from('meal_history')
          .select('*, dishes(*)')
          .order('date', { ascending: false })
          .limit(50); // Get more entries to cover recent and future dates
          
        if (error) throw error;
        
        if (!historyData || historyData.length === 0) return [];
        
        // Map to include dish data
        return historyData
          .filter(entry => entry.dishes) // Only include entries with valid dish data
          .map(entry => ({
            id: entry.id,
            date: entry.date,
            notes: entry.notes,
            dish: mapDishFromDB(entry.dishes, []) // Convert dish data to proper format
          }));
      } catch (error) {
        console.error("Error fetching meal history by date:", error);
        return [];
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Helper to get local date string (YYYY-MM-DD) without timezone issues
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Group meal history by date for easy access
  const getMealsForDate = (dateString: string): Dish[] => {
    return mealHistoryWithDishes
      .filter(entry => {
        const entryDate = new Date(entry.date);
        const entryDateKey = getLocalDateString(entryDate);
        return entryDateKey === dateString;
      })
      .map(entry => entry.dish);
  };

  const getTodaysMeals = (): Dish[] => {
    const today = new Date();
    const todayKey = getLocalDateString(today);
    return getMealsForDate(todayKey);
  };

  const getUpcomingMeals = (): Array<{ date: string; dishes: Dish[] }> => {
    const today = new Date();
    const todayKey = getLocalDateString(today);
    const upcoming = [];
    
    // Check next 3 days
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      const dateKey = getLocalDateString(futureDate);
      const mealsForDate = getMealsForDate(dateKey);
      
      if (mealsForDate.length > 0) {
        upcoming.push({
          date: dateKey,
          dishes: mealsForDate
        });
      }
    }
    
    return upcoming;
  };

  return {
    mealHistoryWithDishes,
    isLoading,
    getMealsForDate,
    getTodaysMeals,
    getUpcomingMeals
  };
}