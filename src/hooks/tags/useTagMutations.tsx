import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from "sonner";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type TagInsert = TablesInsert<"tags">;
export type TagUpdate = TablesUpdate<"tags">;
export type DishTagInsert = TablesInsert<"dish_tags">;

export const useTagMutations = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const createTag = useMutation({
    mutationFn: async (tagData: Omit<TagInsert, "user_id">): Promise<void> => {
      if (!session?.user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("tags")
        .insert({
          ...tagData,
          user_id: session.user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", session?.user?.id] });
      toast.success("Tag created successfully");
    },
    onError: (error) => {
      console.error("Error creating tag:", error);
      toast.error("Failed to create tag");
    },
  });

  const updateTag = useMutation({
    mutationFn: async ({ 
      tagId, 
      updates 
    }: { 
      tagId: string; 
      updates: TagUpdate 
    }): Promise<void> => {
      if (!session?.user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("tags")
        .update(updates)
        .eq("id", tagId)
        .eq("user_id", session.user.id);

      if (error) throw error;
    },
    onSuccess: (_, { tagId }) => {
      queryClient.invalidateQueries({ queryKey: ["tags", session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["tag", tagId] });
      toast.success("Tag updated successfully");
    },
    onError: (error) => {
      console.error("Error updating tag:", error);
      toast.error("Failed to update tag");
    },
  });

  const deleteTag = useMutation({
    mutationFn: async (tagId: string): Promise<void> => {
      if (!session?.user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", tagId)
        .eq("user_id", session.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", session?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      toast.success("Tag deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting tag:", error);
      toast.error("Failed to delete tag");
    },
  });

  const addTagToDish = useMutation({
    mutationFn: async ({ 
      dishId, 
      tagId 
    }: { 
      dishId: string; 
      tagId: string 
    }): Promise<void> => {
      if (!session?.user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("dish_tags")
        .insert({
          dish_id: dishId,
          tag_id: tagId,
        });

      if (error) throw error;
    },
    onSuccess: (_, { dishId }) => {
      queryClient.invalidateQueries({ queryKey: ["dish-tags", dishId] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      toast.success("Tag added to dish");
    },
    onError: (error) => {
      console.error("Error adding tag to dish:", error);
      toast.error("Failed to add tag to dish");
    },
  });

  const removeTagFromDish = useMutation({
    mutationFn: async ({ 
      dishId, 
      tagId 
    }: { 
      dishId: string; 
      tagId: string 
    }): Promise<void> => {
      if (!session?.user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("dish_tags")
        .delete()
        .eq("dish_id", dishId)
        .eq("tag_id", tagId);

      if (error) throw error;
    },
    onSuccess: (_, { dishId }) => {
      queryClient.invalidateQueries({ queryKey: ["dish-tags", dishId] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      toast.success("Tag removed from dish");
    },
    onError: (error) => {
      console.error("Error removing tag from dish:", error);
      toast.error("Failed to remove tag from dish");
    },
  });

  const addMultipleTagsToDish = useMutation({
    mutationFn: async ({ 
      dishId, 
      tagIds 
    }: { 
      dishId: string; 
      tagIds: string[] 
    }): Promise<void> => {
      if (!session?.user?.id) throw new Error("User not authenticated");

      const inserts = tagIds.map(tagId => ({
        dish_id: dishId,
        tag_id: tagId,
      }));

      const { error } = await supabase
        .from("dish_tags")
        .insert(inserts);

      if (error) throw error;
    },
    onSuccess: (_, { dishId }) => {
      queryClient.invalidateQueries({ queryKey: ["dish-tags", dishId] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      toast.success("Tags added to dish");
    },
    onError: (error) => {
      console.error("Error adding tags to dish:", error);
      toast.error("Failed to add tags to dish");
    },
  });

  return {
    createTag,
    updateTag,
    deleteTag,
    addTagToDish,
    removeTagFromDish,
    addMultipleTagsToDish,
  };
};