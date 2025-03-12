
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
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('source->>bookId', cookbookId)
      .order('name');
      
    if (error) throw error;
    return data ? data.map(mapDishFromDB) : [];
  };

  const createCookbook = async (cookbook: Omit<Cookbook, "id" | "createdAt">, userId: string): Promise<Cookbook> => {
    // Ensure name is provided (required field)
    if (!cookbook.name) {
      throw new Error("Cookbook name is required");
    }

    const cookbookToInsert = {
      name: cookbook.name,
      author: cookbook.author || null,
      description: cookbook.description || null,
      user_id: userId
    };

    const { data, error } = await supabase
      .from('cookbooks')
      .insert(cookbookToInsert)
      .select()
      .single();

    if (error) throw error;
    return mapCookbookFromDB(data);
  };

  const updateCookbook = async (cookbook: Partial<Cookbook> & { id: string }, userId: string): Promise<Cookbook> => {
    // Ensure we have at least an ID to update
    if (!cookbook.id) {
      throw new Error("Cookbook ID is required for updates");
    }

    const cookbookToUpdate = {
      ...(cookbook.name && { name: cookbook.name }),
      ...(cookbook.author !== undefined && { author: cookbook.author }),
      ...(cookbook.description !== undefined && { description: cookbook.description }),
      user_id: userId
    };

    const { data, error } = await supabase
      .from('cookbooks')
      .update(cookbookToUpdate)
      .eq('id', cookbook.id)
      .select()
      .single();

    if (error) throw error;
    return mapCookbookFromDB(data);
  };

  return {
    getCookbooks,
    getCookbook,
    getDishesByCookbook,
    createCookbook,
    updateCookbook
  };
}
