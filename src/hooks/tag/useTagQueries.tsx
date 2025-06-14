import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

export type Tag = Tables<"tags">;

export const useTagQueries = () => {
  const { user } = useAuth();

  const useAllTags = () => {
    return useQuery({
      queryKey: ["tags", user?.id],
      queryFn: async (): Promise<Tag[]> => {
        if (!user?.id) throw new Error("User not authenticated");

        const { data, error } = await supabase
          .from("tags")
          .select("*")
          .eq("user_id", user.id)
          .order("name");

        if (error) throw error;
        return data || [];
      },
      enabled: !!user?.id,
    });
  };

  const useTagById = (tagId: string | undefined) => {
    return useQuery({
      queryKey: ["tag", tagId],
      queryFn: async (): Promise<Tag | null> => {
        if (!tagId || !user?.id) return null;

        const { data, error } = await supabase
          .from("tags")
          .select("*")
          .eq("id", tagId)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        return data;
      },
      enabled: !!tagId && !!user?.id,
    });
  };

  const useTagsByDishId = (dishId: string | undefined) => {
    return useQuery({
      queryKey: ["dish-tags", dishId],
      queryFn: async (): Promise<Tag[]> => {
        if (!dishId || !user?.id) return [];

        const { data, error } = await supabase
          .from("dish_tags")
          .select(`
            tags (*)
          `)
          .eq("dish_id", dishId);

        if (error) throw error;
        
        return data?.map(item => item.tags).filter(Boolean) as Tag[] || [];
      },
      enabled: !!dishId && !!user?.id,
    });
  };

  const useTagUsageCount = (tagId: string | undefined) => {
    return useQuery({
      queryKey: ["tag-usage", tagId],
      queryFn: async (): Promise<number> => {
        if (!tagId || !user?.id) return 0;

        const { count, error } = await supabase
          .from("dish_tags")
          .select("*", { count: "exact", head: true })
          .eq("tag_id", tagId);

        if (error) throw error;
        return count || 0;
      },
      enabled: !!tagId && !!user?.id,
    });
  };

  return {
    useAllTags,
    useTagById,
    useTagsByDishId,
    useTagUsageCount,
  };
};