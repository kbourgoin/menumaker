import { Source } from "@/types";
import {
  supabase,
  mapSourceFromDB,
  mapSourceToDB,
} from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Error types for better error handling
export interface SourceMutationError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

// Type guard for error objects
const isErrorWithCode = (
  error: unknown
): error is {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
} => {
  return error !== null && typeof error === "object";
};

// Helper function to create standardized error objects
const createSourceMutationError = (
  message: string,
  originalError?: unknown
): SourceMutationError => {
  const error = new Error(message) as SourceMutationError;
  if (originalError && isErrorWithCode(originalError)) {
    error.code = originalError.code;
    error.details = originalError.details;
    error.hint = originalError.hint;
    error.cause = originalError;
  }
  return error;
};

// Helper function to handle authentication errors
const handleAuthError = (error: unknown): never => {
  if (
    isErrorWithCode(error) &&
    (error.message?.includes("JWT") || error.code === "PGRST301")
  ) {
    throw createSourceMutationError(
      "Authentication failed. Please log in again.",
      error
    );
  }
  throw error;
};

export function useSourceMutations() {
  const queryClient = useQueryClient();

  // Add a new source
  const addSource = useMutation({
    mutationFn: async (
      source: Omit<Source, "id" | "createdAt" | "user_id">
    ) => {
      // Validate input
      if (!source.name || !source.name.trim()) {
        throw createSourceMutationError("Source name is required");
      }

      try {
        const { data: userData, error: authError } =
          await supabase.auth.getUser();

        if (authError) {
          handleAuthError(authError);
        }

        const user_id = userData.user?.id;

        if (!user_id) {
          throw createSourceMutationError("User not authenticated");
        }

        // Get user's household_id
        // @ts-expect-error - household_id not in auto-generated profile types yet
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("household_id")
          .eq("id", user_id)
          .single();

        if (profileError || !profile?.household_id) {
          throw new Error("Could not determine household");
        }

        const sourceToInsert = {
          ...source,
          name: source.name.trim(),
          user_id,
          household_id: profile.household_id,
        };

        const { data, error } = await supabase
          .from("sources")
          .insert(sourceToInsert)
          .select()
          .single();

        if (error) {
          // Handle specific database errors
          if (error.code === "23505") {
            // Unique constraint violation
            throw createSourceMutationError(
              "A source with this name already exists",
              error
            );
          }
          throw createSourceMutationError(
            `Failed to add source: ${error.message}`,
            error
          );
        }

        return mapSourceFromDB(data);
      } catch (error) {
        console.error("Error adding source:", error);
        throw error instanceof Error
          ? error
          : createSourceMutationError(
              "Unknown error occurred while adding source"
            );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
    },
    onError: error => {
      console.error("Source addition failed:", error);
    },
  });

  // Update an existing source
  const updateSource = useMutation({
    mutationFn: async (source: Partial<Source> & { id: string }) => {
      // Validate input
      if (!source.id) {
        throw createSourceMutationError("Source ID is required for update");
      }

      if (source.name !== undefined && (!source.name || !source.name.trim())) {
        throw createSourceMutationError("Source name cannot be empty");
      }

      try {
        const { data: userData, error: authError } =
          await supabase.auth.getUser();

        if (authError) {
          handleAuthError(authError);
        }

        const user_id = userData.user?.id;

        if (!user_id) {
          throw createSourceMutationError("User not authenticated");
        }

        // Only include properties that are present and trim name if provided
        const sourceToUpdate = mapSourceToDB({
          ...source,
          name: source.name ? source.name.trim() : source.name,
        });

        const { data, error } = await supabase
          .from("sources")
          .update(sourceToUpdate)
          .eq("id", source.id)
          .eq("user_id", user_id)
          .select()
          .single();

        if (error) {
          // Handle specific database errors
          if (error.code === "23505") {
            // Unique constraint violation
            throw createSourceMutationError(
              "A source with this name already exists",
              error
            );
          }
          if (error.code === "PGRST116") {
            // No rows affected
            throw createSourceMutationError(
              "Source not found or you do not have permission to update it",
              error
            );
          }
          throw createSourceMutationError(
            `Failed to update source: ${error.message}`,
            error
          );
        }

        return mapSourceFromDB(data);
      } catch (error) {
        console.error("Error updating source:", error);
        throw error instanceof Error
          ? error
          : createSourceMutationError(
              "Unknown error occurred while updating source"
            );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
    },
    onError: error => {
      console.error("Source update failed:", error);
    },
  });

  // Delete a source
  const deleteSource = useMutation({
    mutationFn: async (id: string) => {
      // Validate input
      if (!id) {
        throw createSourceMutationError("Source ID is required for deletion");
      }

      try {
        const { data: userData, error: authError } =
          await supabase.auth.getUser();

        if (authError) {
          handleAuthError(authError);
        }

        const user_id = userData.user?.id;

        if (!user_id) {
          throw createSourceMutationError("User not authenticated");
        }

        // First update any dishes that reference this source
        const { error: dishUpdateError } = await supabase
          .from("dishes")
          .update({ source_id: null })
          .eq("source_id", id)
          .eq("user_id", user_id);

        if (dishUpdateError) {
          throw createSourceMutationError(
            `Failed to update linked dishes: ${dishUpdateError.message}`,
            dishUpdateError
          );
        }

        // Then delete the source
        const { error } = await supabase
          .from("sources")
          .delete()
          .eq("id", id)
          .eq("user_id", user_id);

        if (error) {
          if (error.code === "PGRST116") {
            // No rows affected
            throw createSourceMutationError(
              "Source not found or you do not have permission to delete it",
              error
            );
          }
          throw createSourceMutationError(
            `Failed to delete source: ${error.message}`,
            error
          );
        }

        return id;
      } catch (error) {
        console.error("Error deleting source:", error);
        throw error instanceof Error
          ? error
          : createSourceMutationError(
              "Unknown error occurred while deleting source"
            );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
    },
    onError: error => {
      console.error("Source deletion failed:", error);
    },
  });

  return {
    // Mutation functions
    addSource: addSource.mutateAsync,
    updateSource: updateSource.mutateAsync,
    deleteSource: deleteSource.mutateAsync,

    // Mutation state
    isAddingSource: addSource.isPending,
    isUpdatingSource: updateSource.isPending,
    isDeletingSource: deleteSource.isPending,

    // Error utilities
    createSourceMutationError,
  };
}
