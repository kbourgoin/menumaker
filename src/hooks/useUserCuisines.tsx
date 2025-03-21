
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CuisineType } from "@/types";
import { CUISINES as DEFAULT_CUISINES } from "@/components/dish-form/constants";

export const useUserCuisines = () => {
  const { session } = useAuth();
  const [cuisines, setCuisines] = useState<CuisineType[]>(DEFAULT_CUISINES);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's cuisines
  useEffect(() => {
    const fetchUserCuisines = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('cuisines')
          .eq('id', session.user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data?.cuisines && data.cuisines.length > 0) {
          setCuisines(data.cuisines as CuisineType[]);
        }
      } catch (error) {
        console.error('Error fetching user cuisines:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCuisines();
  }, [session]);

  // Update user's cuisines
  const updateUserCuisines = async (newCuisines: CuisineType[]) => {
    if (!session?.user) {
      toast.error("You must be logged in to update cuisines");
      return false;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ cuisines: newCuisines })
        .eq('id', session.user.id);

      if (error) {
        throw error;
      }

      setCuisines(newCuisines);
      toast.success("Cuisines updated successfully");
      return true;
    } catch (error: any) {
      console.error('Error updating cuisines:', error);
      toast.error(error.message || "Failed to update cuisines");
      return false;
    }
  };

  // Add a new cuisine to the user's list
  const addCuisine = async (cuisine: string) => {
    if (!cuisine.trim()) return false;
    
    // Check if cuisine already exists (case insensitive)
    const cuisineExists = cuisines.some(
      c => c.toLowerCase() === cuisine.trim().toLowerCase()
    );
    
    if (cuisineExists) {
      toast.error("This cuisine already exists");
      return false;
    }
    
    const newCuisines = [...cuisines, cuisine.trim() as CuisineType];
    return await updateUserCuisines(newCuisines);
  };

  // Remove a cuisine from the user's list
  const removeCuisine = async (cuisine: CuisineType) => {
    // Don't allow removing the "Other" cuisine
    if (cuisine === "Other") {
      toast.error("The 'Other' cuisine cannot be removed");
      return false;
    }
    
    const newCuisines = cuisines.filter(c => c !== cuisine);
    return await updateUserCuisines(newCuisines);
  };

  // Reset cuisines to defaults
  const resetToDefaults = async () => {
    return await updateUserCuisines(DEFAULT_CUISINES);
  };

  return {
    cuisines,
    isLoading,
    updateUserCuisines,
    addCuisine,
    removeCuisine,
    resetToDefaults
  };
};
