import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";
import type { TagCategory } from "@/types";

export type Tag = Tables<"tags">;

export const useTagQueries = () => {
  const { session } = useAuth();

  const useAllTags = () => {
    return useQuery({
      queryKey: ["tags", session?.user?.id],
      queryFn: async (): Promise<Tag[]> => {
        if (!session?.user?.id) throw new Error("User not authenticated");

        const { data, error } = await supabase
          .from("tags")
          .select("*")
          .eq("user_id", session.user.id)
          .order("name");

        if (error) throw error;
        return data || [];
      },
      enabled: !!session?.user?.id,
    });
  };

  const useTagById = (tagId: string | undefined) => {
    return useQuery({
      queryKey: ["tag", tagId],
      queryFn: async (): Promise<Tag | null> => {
        if (!tagId || !session?.user?.id) return null;

        const { data, error } = await supabase
          .from("tags")
          .select("*")
          .eq("id", tagId)
          .eq("user_id", session.user.id)
          .single();

        if (error) throw error;
        return data;
      },
      enabled: !!tagId && !!session?.user?.id,
    });
  };

  const useTagsByDishId = (dishId: string | undefined) => {
    return useQuery({
      queryKey: ["dish-tags", dishId],
      queryFn: async (): Promise<Tag[]> => {
        if (!dishId || !session?.user?.id) return [];

        const { data, error } = await supabase
          .from("dish_tags")
          .select(`
            tags (*)
          `)
          .eq("dish_id", dishId);

        if (error) throw error;
        
        return data?.map(item => item.tags).filter(Boolean) as Tag[] || [];
      },
      enabled: !!dishId && !!session?.user?.id,
    });
  };

  const useTagUsageCount = (tagId: string | undefined) => {
    return useQuery({
      queryKey: ["tag-usage", tagId],
      queryFn: async (): Promise<number> => {
        if (!tagId || !session?.user?.id) return 0;

        const { count, error } = await supabase
          .from("dish_tags")
          .select("*", { count: "exact", head: true })
          .eq("tag_id", tagId);

        if (error) throw error;
        return count || 0;
      },
      enabled: !!tagId && !!session?.user?.id,
    });
  };

  const useTagsByCategory = (category: TagCategory) => {
    return useQuery({
      queryKey: ["tags-by-category", category, session?.user?.id],
      queryFn: async (): Promise<Tag[]> => {
        if (!session?.user?.id) throw new Error("User not authenticated");

        const { data, error } = await supabase
          .from("tags")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("category", category)
          .order("name");

        if (error) throw error;
        return data || [];
      },
      enabled: !!session?.user?.id,
    });
  };

  const useCuisineTags = () => useTagsByCategory('cuisine');
  const useGeneralTags = () => useTagsByCategory('general');

  return {
    useAllTags,
    useTagById,
    useTagsByDishId,
    useTagUsageCount,
    useTagsByCategory,
    useCuisineTags,
    useGeneralTags,
  };
};