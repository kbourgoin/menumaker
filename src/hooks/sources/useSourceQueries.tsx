import { Source, Dish } from "@/types";
import { Tables } from "@/integrations/supabase/types";
import {
  supabase,
  mapSourceFromDB,
  mapDishFromDB,
} from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { measureAsync, trackQuery } from "@/utils/performance";

// Error types for better error handling
export interface SourceQueryError extends Error {
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
const createSourceError = (
  message: string,
  originalError?: unknown
): SourceQueryError => {
  const error = new Error(message) as SourceQueryError;
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
    throw createSourceError(
      "Authentication failed. Please log in again.",
      error
    );
  }
  throw error;
};

export function useSourceQueries() {
  // Get all sources with React Query
  const {
    data: sources = [],
    isLoading: isLoadingSources,
    error: sourcesError,
    refetch: refetchSources,
    isError: isSourcesError,
  } = useQuery({
    queryKey: ["sources"],
    queryFn: async (): Promise<Source[]> => {
      return await measureAsync("sources-query", async () => {
        try {
          const { data: userData, error: authError } =
            await supabase.auth.getUser();

          if (authError) {
            handleAuthError(authError);
          }

          const user_id = userData.user?.id;

          if (!user_id) {
            throw createSourceError("User not authenticated");
          }

          const { data, error } = await supabase
            .from("sources")
            .select("*")
            .eq("user_id", user_id)
            .order("name");

          if (error) {
            throw createSourceError(
              `Failed to fetch sources: ${error.message}`,
              error
            );
          }

          const sources = data ? data.map(mapSourceFromDB) : [];

          trackQuery({
            queryType: "sources-list",
            duration: 0, // Will be set by measureAsync
            recordCount: sources.length,
            success: true,
          });

          return sources;
        } catch (error) {
          console.error("Error in sources query:", error);
          trackQuery({
            queryType: "sources-list",
            duration: 0,
            recordCount: 0,
            success: false,
          });
          // Re-throw the error so React Query can handle it properly
          throw error instanceof Error
            ? error
            : createSourceError(
                "Unknown error occurred while fetching sources"
              );
        }
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error?.message?.includes("Authentication failed")) {
        return false;
      }
      // Don't retry on user not found errors
      if (error?.message?.includes("User not authenticated")) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Get a single source by ID
  const getSource = async (id: string): Promise<Source | null> => {
    if (!id) {
      throw createSourceError("Source ID is required");
    }

    try {
      const { data: userData, error: authError } =
        await supabase.auth.getUser();

      if (authError) {
        handleAuthError(authError);
      }

      const user_id = userData.user?.id;

      if (!user_id) {
        throw createSourceError("User not authenticated");
      }

      const { data, error } = await supabase
        .from("sources")
        .select("*")
        .eq("id", id)
        .eq("user_id", user_id) // Add user_id check for security
        .maybeSingle();

      if (error) {
        throw createSourceError(
          `Failed to fetch source: ${error.message}`,
          error
        );
      }

      return data ? mapSourceFromDB(data) : null;
    } catch (error) {
      console.error("Error fetching source:", error);
      // Re-throw for proper error handling
      throw error instanceof Error
        ? error
        : createSourceError("Unknown error occurred while fetching source");
    }
  };

  // Get all dishes associated with a source
  const getDishesBySource = async (sourceId: string): Promise<Dish[]> => {
    if (!sourceId) {
      throw createSourceError("Source ID is required");
    }

    try {
      const { data: userData, error: authError } =
        await supabase.auth.getUser();

      if (authError) {
        handleAuthError(authError);
      }

      const user_id = userData.user?.id;

      if (!user_id) {
        throw createSourceError("User not authenticated");
      }

      const { data: dishesData, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("source_id", sourceId)
        .eq("user_id", user_id)
        .order("name");

      if (error) {
        throw createSourceError(
          `Failed to fetch dishes by source: ${error.message}`,
          error
        );
      }

      // Get meal history for these dishes
      const dishIds = dishesData?.map(dish => dish.id) || [];
      let mealHistoryByDish: Record<string, Tables<"meal_history">[]> = {};

      if (dishIds.length > 0) {
        try {
          const { data: historyData, error: historyError } = await supabase
            .from("meal_history")
            .select("*")
            .in("dishid", dishIds);

          if (historyError) {
            // Log the error but don't fail the entire operation
            console.warn(
              "Failed to fetch meal history for dishes:",
              historyError
            );
          } else if (historyData) {
            // Group history by dish ID
            mealHistoryByDish = historyData.reduce(
              (acc, history) => {
                if (!acc[history.dishid]) {
                  acc[history.dishid] = [];
                }
                acc[history.dishid].push(history);
                return acc;
              },
              {} as Record<string, Tables<"meal_history">[]>
            );
          }
        } catch (historyError) {
          // Log the error but don't fail the entire operation
          console.warn("Error fetching meal history:", historyError);
        }
      }

      return dishesData
        ? dishesData.map(dish =>
            mapDishFromDB(dish, mealHistoryByDish[dish.id] || [])
          )
        : [];
    } catch (error) {
      console.error("Error in getDishesBySource:", error);
      // Re-throw for proper error handling
      throw error instanceof Error
        ? error
        : createSourceError(
            "Unknown error occurred while fetching dishes by source"
          );
    }
  };

  // Check if source with the same name exists
  const findSourceByName = async (
    name: string,
    excludeId?: string
  ): Promise<Source | null> => {
    if (!name || !name.trim()) {
      throw createSourceError("Source name is required");
    }

    try {
      const { data: userData, error: authError } =
        await supabase.auth.getUser();

      if (authError) {
        handleAuthError(authError);
      }

      const user_id = userData.user?.id;

      if (!user_id) {
        throw createSourceError("User not authenticated");
      }

      const query = supabase
        .from("sources")
        .select("*")
        .eq("user_id", user_id)
        .ilike("name", name.trim());

      // Exclude the current source if editing
      if (excludeId) {
        query.neq("id", excludeId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        throw createSourceError(
          `Failed to find source by name: ${error.message}`,
          error
        );
      }

      return data ? mapSourceFromDB(data) : null;
    } catch (error) {
      console.error("Error in findSourceByName:", error);
      // Re-throw for proper error handling
      throw error instanceof Error
        ? error
        : createSourceError(
            "Unknown error occurred while finding source by name"
          );
    }
  };

  return {
    // Query state
    sources,
    isLoadingSources,
    sourcesError,
    isSourcesError,
    refetchSources,

    // Helper functions
    getSources: async (): Promise<Source[]> => sources || [],
    getSource,
    getDishesBySource,
    findSourceByName,

    // Error utilities
    createSourceError,
  };
}
