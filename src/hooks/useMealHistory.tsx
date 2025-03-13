import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase, mapDishFromDB } from "@/integrations/supabase/client";
import { Dish } from "@/types";
import { useSources } from "./useSources";

export function useMealHistory() {
  const [isRecording, setIsRecording] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { getSource } = useSources();

  // Record a dish as cooked
  const recordDishCooked = async (dish: Dish, date: string, notes?: string) => {
    try {
      setIsRecording(true);
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      
      if (!userId) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to record meals",
          variant: "destructive",
        });
        return null;
      }
      
      // Insert meal history record
      const { data, error } = await supabase
        .from('meal_history')
        .insert({
          dishid: dish.id,
          date: date,
          notes: notes || null,
          user_id: userId
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Invalidate cached data
      queryClient.invalidateQueries({ queryKey: ['dish', dish.id] });
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      return data;
    } catch (error) {
      console.error("Error recording dish:", error);
      toast({
        title: "Error recording meal",
        description: "There was a problem saving your meal",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsRecording(false);
    }
  };

  // Get meal history for a dish
  const getMealHistoryForDish = async (dishId: string) => {
    const { data: historyData, error } = await supabase
      .from('meal_history')
      .select('*')
      .eq('dishid', dishId)
      .order('date', { ascending: false });
      
    if (error) {
      console.error("Error fetching meal history:", error);
      return [];
    }
    
    return historyData.map(entry => ({
      id: entry.id,
      date: entry.date,
      notes: entry.notes || undefined
    }));
  };

  return {
    recordDishCooked,
    getMealHistoryForDish,
    isRecording
  };
}
