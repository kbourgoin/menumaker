
import { Cookbook, Dish } from "@/types";
import { 
  supabase, 
  mapCookbookFromDB, 
  mapCookbookToDB,
  mapDishFromDB 
} from "@/integrations/supabase/client";

export function useCookbooks() {
  // Cookbook functions
  const getCookbooks = async (): Promise<Cookbook[]> => {
    const { data, error } = await supabase
      .from('cookbooks')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data ? data.map(mapCookbookFromDB) : [];
  };

  const getCookbook = async (id: string): Promise<Cookbook> => {
    const { data, error } = await supabase
      .from('cookbooks')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return mapCookbookFromDB(data);
  };

  const getDishesByCookbook = async (cookbookId: string): Promise<Dish[]> => {
    // Fix the infinite type instantiation by explicitly defining the field we're querying
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('source->>bookId', cookbookId)
      .order('name');
      
    if (error) throw error;
    return data ? data.map(mapDishFromDB) : [];
  };

  return {
    getCookbooks,
    getCookbook,
    getDishesByCookbook
  };
}
