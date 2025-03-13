
import { Source, Dish } from "@/types";
import { 
  supabase, 
  mapSourceFromDB, 
  mapSourceToDB,
  mapDishFromDB 
} from "@/integrations/supabase/client";

export function useSources() {
  // Source functions
  const getSources = async (): Promise<Source[]> => {
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data ? data.map(mapSourceFromDB) : [];
  };

  const getSource = async (id: string): Promise<Source> => {
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return mapSourceFromDB(data);
  };

  // Get dishes by source ID
  const getDishesBySource = async (sourceId: string): Promise<Dish[]> => {
    const { data: dishesData, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('source_id', sourceId)
      .order('name');
      
    if (error) throw error;
    
    // Fetch meal history for all dishes
    const dishIds = dishesData ? dishesData.map(dish => dish.id) : [];
    
    let historyByDishId: Record<string, any[]> = {};
    
    if (dishIds.length > 0) {
      const { data: historyData, error: historyError } = await supabase
        .from('meal_history')
        .select('*')
        .in('dishid', dishIds);
        
      if (!historyError && historyData) {
        // Group meal history by dish ID
        historyByDishId = historyData.reduce((acc: Record<string, any[]>, entry) => {
          if (!acc[entry.dishid]) {
            acc[entry.dishid] = [];
          }
          acc[entry.dishid].push(entry);
          return acc;
        }, {});
      }
    }
    
    // Now map each dish with its corresponding meal history
    return dishesData 
      ? dishesData.map(dish => mapDishFromDB(dish, historyByDishId[dish.id] || []))
      : [];
  };

  // Create a new source
  const createSource = async (
    source: Omit<Source, "id" | "createdAt" | "user_id">, 
    userId: string
  ): Promise<Source> => {
    // Ensure name is provided (required field)
    if (!source.name) {
      throw new Error("Source name is required");
    }

    // Ensure type is provided (required field)
    if (!source.type) {
      throw new Error("Source type is required");
    }

    const sourceToInsert = {
      name: source.name,
      location: source.location || null,
      type: source.type,
      description: source.description || null,
      user_id: userId
    };

    const { data, error } = await supabase
      .from('sources')
      .insert(sourceToInsert)
      .select()
      .single();

    if (error) throw error;
    return mapSourceFromDB(data);
  };

  // Update an existing source
  const updateSource = async (source: Partial<Source> & { id: string }, userId: string): Promise<Source> => {
    // Ensure we have at least an ID to update
    if (!source.id) {
      throw new Error("Source ID is required for updates");
    }

    const sourceToUpdate = {
      ...(source.name && { name: source.name }),
      ...(source.location !== undefined && { location: source.location }),
      ...(source.type && { type: source.type }),
      ...(source.description !== undefined && { description: source.description }),
      user_id: userId
    };

    const { data, error } = await supabase
      .from('sources')
      .update(sourceToUpdate)
      .eq('id', source.id)
      .select()
      .single();

    if (error) throw error;
    return mapSourceFromDB(data);
  };

  return {
    getSources,
    getSource,
    getDishesBySource,
    createSource,
    updateSource
  };
}
