
import { useState } from "react";
import { Dish, Cookbook } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useDishes() {
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Query to fetch dishes from Supabase
  const { data: dishes = [] } = useQuery({
    queryKey: ['dishes'],
    queryFn: async (): Promise<Dish[]> => {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setIsLoading(false);
      return data || [];
    }
  });

  // Mutation to add a new dish
  const addDishMutation = useMutation({
    mutationFn: async (dish: Omit<Dish, "id" | "createdAt" | "timesCooked" | "user_id">) => {
      const newDish = {
        ...dish,
        timesCooked: 0,
        createdAt: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('dishes')
        .insert(newDish)
        .select('*')
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
    }
  });

  // Mutation to update a dish
  const updateDishMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Dish> }) => {
      const { error } = await supabase
        .from('dishes')
        .update(updates)
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
    }
  });

  // Mutation to delete a dish
  const deleteDishMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete related meal history
      await supabase
        .from('meal_history')
        .delete()
        .eq('dishId', id);
        
      // Then delete the dish
      const { error } = await supabase
        .from('dishes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
    }
  });

  // Mutation to record a dish was cooked
  const recordDishCookedMutation = useMutation({
    mutationFn: async ({ dishId, date = new Date().toISOString(), notes }: { dishId: string, date?: string, notes?: string }) => {
      // Add to meal history
      const { error: historyError } = await supabase
        .from('meal_history')
        .insert({ dishId, date, notes });
      
      if (historyError) throw historyError;
      
      // Update dish data (increment timesCooked and update lastMade)
      const { error: dishError } = await supabase
        .from('dishes')
        .update({ 
          timesCooked: supabase.rpc('increment_times_cooked', { dish_id: dishId }),
          lastMade: date 
        })
        .eq('id', dishId);
      
      if (dishError) throw dishError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
    }
  });

  // Get dish by ID
  const getDish = async (id: string): Promise<Dish> => {
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  };

  // Get weekly dish suggestions
  const getWeeklyDishSuggestions = async (count: number = 7): Promise<Dish[]> => {
    // This is complex logic that would be better as a Postgres function
    // For now, we'll fetch all dishes and calculate client-side
    const { data: allDishes, error } = await supabase
      .from('dishes')
      .select('*');
      
    if (error) throw error;
    
    if (!allDishes || allDishes.length === 0) return [];
    if (allDishes.length <= count) return allDishes;
    
    // The weighted random logic would be similar to the localStorage version
    // but can be moved to a database function later
    const today = new Date();
    
    // Calculate weights (simplified version of the original logic)
    const dishesWithWeights = allDishes.map(dish => {
      const frequencyWeight = dish.timesCooked === 0 ? 5 : (10 / (dish.timesCooked + 1));
      
      let recencyWeight = 5; // Default for never made
      if (dish.lastMade) {
        const daysSinceLastMade = Math.max(
          1, 
          Math.floor((today.getTime() - new Date(dish.lastMade).getTime()) / (1000 * 60 * 60 * 24))
        );
        recencyWeight = Math.min(10, daysSinceLastMade / 7);
      }
      
      const oldFavoriteBonus = 
        dish.timesCooked > 3 && 
        dish.lastMade && 
        (today.getTime() - new Date(dish.lastMade).getTime()) > (90 * 24 * 60 * 60 * 1000)
          ? 5 
          : 0;
      
      return {
        dish,
        weight: frequencyWeight + recencyWeight + oldFavoriteBonus
      };
    });
    
    // Sort by weight (higher weights first)
    dishesWithWeights.sort((a, b) => b.weight - a.weight);
    
    // Get the top dishes by weight with some randomness
    const topDishes = dishesWithWeights.slice(0, Math.max(count * 2, Math.floor(allDishes.length * 0.6)));
    
    const suggestions: Dish[] = [];
    const selectedIndexes = new Set<number>();
    
    while (suggestions.length < count && suggestions.length < topDishes.length) {
      const randomIndex = Math.floor(Math.random() * topDishes.length);
      if (!selectedIndexes.has(randomIndex)) {
        selectedIndexes.add(randomIndex);
        suggestions.push(topDishes[randomIndex].dish);
      }
    }
    
    return suggestions;
  };

  // Get meal history for a dish
  const getMealHistoryForDish = async (dishId: string) => {
    const { data, error } = await supabase
      .from('meal_history')
      .select('*')
      .eq('dishId', dishId)
      .order('date', { ascending: false });
      
    if (error) throw error;
    return data.map(entry => ({
      date: entry.date,
      notes: entry.notes
    }));
  };

  // Get dish stats
  const getStats = async () => {
    const { data: dishes, error: dishesError } = await supabase
      .from('dishes')
      .select('*');
      
    if (dishesError) throw dishesError;
    
    const { data: history, error: historyError } = await supabase
      .from('meal_history')
      .select('*')
      .order('date', { ascending: false })
      .limit(5);
      
    if (historyError) throw historyError;
    
    // Get most cooked dish
    const mostCooked = [...dishes].sort((a, b) => b.timesCooked - a.timesCooked)[0];
    
    // Get cuisine breakdown
    const cuisineBreakdown = dishes.reduce((acc: Record<string, number>, dish) => {
      dish.cuisines.forEach(cuisine => {
        acc[cuisine] = (acc[cuisine] || 0) + 1;
      });
      return acc;
    }, {});
    
    // Transform recent history to include dish data
    const recentlyCooked = await Promise.all(
      history.map(async h => {
        const dish = dishes.find(d => d.id === h.dishId);
        return {
          date: h.date,
          dish
        };
      })
    );
    
    return {
      totalDishes: dishes.length,
      totalTimesCooked: dishes.reduce((sum, dish) => sum + dish.timesCooked, 0),
      mostCooked,
      cuisineBreakdown,
      recentlyCooked
    };
  };

  // Import meal history
  const importMealHistory = async (
    entries: { 
      date: string; 
      dish: string; 
      notes?: string;
      source?: {
        type: 'url' | 'book' | 'none';
        value: string;
        page?: number;
        bookId?: string;
      };
    }[]
  ) => {
    let successCount = 0;
    let skippedCount = 0;
    
    // Group entries by dish name
    const entriesByDish: Record<string, typeof entries> = {};
    
    entries.forEach(entry => {
      const dishLower = entry.dish.toLowerCase();
      if (!entriesByDish[dishLower]) {
        entriesByDish[dishLower] = [];
      }
      entriesByDish[dishLower].push(entry);
    });
    
    // Process each unique dish
    for (const [dishLower, dishEntries] of Object.entries(entriesByDish)) {
      // Check if dish already exists
      const { data: existingDishes } = await supabase
        .from('dishes')
        .select('*')
        .ilike('name', dishEntries[0].dish);
      
      let dishId;
      
      // If dish doesn't exist, create it
      if (!existingDishes || existingDishes.length === 0) {
        const firstEntry = dishEntries[0];
        let source = firstEntry.source || {
          type: 'none',
          value: ''
        };
        
        // If it's a book source, try to find or create cookbook
        if (source.type === 'book' && source.value) {
          const { data: existingCookbooks } = await supabase
            .from('cookbooks')
            .select('*')
            .ilike('name', source.value);
          
          let cookbookId;
          
          if (!existingCookbooks || existingCookbooks.length === 0) {
            // Create new cookbook
            const { data: newCookbook } = await supabase
              .from('cookbooks')
              .insert({ name: source.value })
              .select('id')
              .single();
              
            if (newCookbook) {
              cookbookId = newCookbook.id;
            }
          } else {
            cookbookId = existingCookbooks[0].id;
          }
          
          if (cookbookId) {
            source = {
              ...source,
              bookId: cookbookId
            };
          }
        }
        
        // Create new dish
        const { data: newDish } = await supabase
          .from('dishes')
          .insert({
            name: firstEntry.dish,
            createdAt: firstEntry.date,
            timesCooked: 0,
            cuisines: ['Other'],
            source
          })
          .select('id')
          .single();
          
        if (newDish) {
          dishId = newDish.id;
        }
      } else {
        dishId = existingDishes[0].id;
      }
      
      if (dishId) {
        // Process all entries for this dish
        let newCookCount = 0;
        
        for (const entry of dishEntries) {
          // Check if this entry already exists
          const { data: existingEntries } = await supabase
            .from('meal_history')
            .select('*')
            .eq('dishId', dishId)
            .eq('date', entry.date);
            
          if (!existingEntries || existingEntries.length === 0) {
            // Add to meal history
            await supabase
              .from('meal_history')
              .insert({
                dishId,
                date: entry.date,
                notes: entry.notes
              });
              
            newCookCount++;
            successCount++;
          } else {
            skippedCount++;
          }
        }
        
        // Update dish stats if needed
        if (newCookCount > 0) {
          // Find the most recent entry
          const sortedEntries = [...dishEntries].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          
          await supabase
            .from('dishes')
            .update({
              lastMade: sortedEntries[0].date,
              timesCooked: supabase.rpc('increment_by', { dish_id: dishId, increment_amount: newCookCount })
            })
            .eq('id', dishId);
        }
      }
    }
    
    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['dishes'] });
    queryClient.invalidateQueries({ queryKey: ['mealHistory'] });
    
    return { success: successCount, skipped: skippedCount };
  };

  // Clear all data
  const clearData = async () => {
    // Delete all data in reverse order of dependencies
    await supabase.from('meal_history').delete().neq('id', '0');
    await supabase.from('dishes').delete().neq('id', '0');
    await supabase.from('cookbooks').delete().neq('id', '0');
    
    // Refresh queries
    queryClient.invalidateQueries();
  };

  // Cookbook functions
  const getCookbooksData = async (): Promise<Cookbook[]> => {
    const { data, error } = await supabase
      .from('cookbooks')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data || [];
  };

  const getCookbookData = async (id: string): Promise<Cookbook> => {
    const { data, error } = await supabase
      .from('cookbooks')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  };

  const getDishesByCookbook = async (cookbookId: string): Promise<Dish[]> => {
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('source->bookId', cookbookId)
      .order('name');
      
    if (error) throw error;
    return data || [];
  };

  return {
    dishes,
    isLoading,
    addDish: (dish: Omit<Dish, "id" | "createdAt" | "timesCooked" | "user_id">) => addDishMutation.mutateAsync(dish),
    updateDish: (id: string, updates: Partial<Dish>) => updateDishMutation.mutateAsync({ id, updates }),
    deleteDish: (id: string) => deleteDishMutation.mutateAsync(id),
    recordDishCooked: (dishId: string, date?: string, notes?: string) => 
      recordDishCookedMutation.mutateAsync({ dishId, date, notes }),
    getWeeklyDishSuggestions,
    getDish,
    getStats,
    getMealHistoryForDish,
    importMealHistory,
    clearData,
    getCookbooks: getCookbooksData,
    getCookbook: getCookbookData,
    getDishesByCookbook
  };
}
