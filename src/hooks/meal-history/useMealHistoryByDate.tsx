import { useQuery } from "@tanstack/react-query";
import { supabase, mapDishFromDB } from "@/integrations/supabase/client";
import { Dish } from "@/types";

export function useMealHistoryByDate() {
  // Get meal history with dish data for dashboard
  const { data: mealHistoryWithDishes = [], isLoading } = useQuery({
    queryKey: ['mealHistoryByDate'],
    queryFn: async () => {
      try {
        // Fetch ALL meal history to properly calculate dish statistics
        const { data: allHistoryData, error: allHistoryError } = await supabase
          .from('meal_history')
          .select('*')
          .order('date', { ascending: false });
          
        if (allHistoryError) throw allHistoryError;
        
        // Fetch meal history with dishes joined for display (limit to recent entries)
        const { data: historyData, error } = await supabase
          .from('meal_history')
          .select('*, dishes(*)')
          .order('date', { ascending: false })
          .limit(50); // Get more entries to cover recent and future dates
          
        if (error) throw error;
        
        if (!historyData || historyData.length === 0) return [];
        
        // Group all meal history by dish ID for proper statistics calculation
        const historyByDishId: Record<string, unknown[]> = {};
        (allHistoryData || []).forEach(entry => {
          if (!historyByDishId[entry.dishid]) {
            historyByDishId[entry.dishid] = [];
          }
          historyByDishId[entry.dishid].push(entry);
        });
        
        // Map to include dish data with proper statistics
        return historyData
          .filter(entry => entry.dishes) // Only include entries with valid dish data
          .map(entry => ({
            id: entry.id,
            date: entry.date,
            notes: entry.notes,
            dish: mapDishFromDB(entry.dishes, historyByDishId[entry.dishes.id] || []) // Convert dish data with full meal history
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