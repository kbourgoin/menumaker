import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface UserActivity {
  type:
    | "dish_created"
    | "dish_updated"
    | "dish_deleted"
    | "meal_logged"
    | "source_created";
  timestamp: number;
  userId: string;
}

interface CacheInvalidationConfig {
  idleThreshold: number; // Time in ms after which to invalidate stale cache
  activityWindow: number; // Time window to track user activity
}

const DEFAULT_CONFIG: CacheInvalidationConfig = {
  idleThreshold: 5 * 60 * 1000, // 5 minutes
  activityWindow: 10 * 60 * 1000, // 10 minutes
};

export function useDynamicCacheInvalidation(
  config: Partial<CacheInvalidationConfig> = {}
) {
  const queryClient = useQueryClient();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const userActivityRef = useRef<UserActivity[]>([]);
  const lastActivityRef = useRef<number>(Date.now());

  // Track user activity
  const recordActivity = (type: UserActivity["type"], userId: string) => {
    const timestamp = Date.now();
    lastActivityRef.current = timestamp;

    userActivityRef.current.push({
      type,
      timestamp,
      userId,
    });

    // Clean up old activities outside the window
    const cutoff = timestamp - finalConfig.activityWindow;
    userActivityRef.current = userActivityRef.current.filter(
      activity => activity.timestamp > cutoff
    );

    // Invalidate related queries based on activity type
    switch (type) {
      case "dish_created":
      case "dish_updated":
      case "dish_deleted":
        queryClient.invalidateQueries({ queryKey: ["dishes"] });
        break;
      case "meal_logged":
        queryClient.invalidateQueries({ queryKey: ["dishes"] });
        queryClient.invalidateQueries({ queryKey: ["mealHistory"] });
        queryClient.invalidateQueries({ queryKey: ["mealHistoryByDate"] });
        break;
      case "source_created":
        queryClient.invalidateQueries({ queryKey: ["sources"] });
        break;
    }
  };

  // Check for idle state and invalidate stale cache
  useEffect(() => {
    const checkIdleState = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      if (timeSinceLastActivity > finalConfig.idleThreshold) {
        // User has been idle, invalidate potentially stale cache
        queryClient.invalidateQueries({
          queryKey: ["dishes"],
          refetchType: "none", // Don't refetch immediately, wait for user interaction
        });
      }
    };

    const intervalId = setInterval(checkIdleState, finalConfig.idleThreshold);
    return () => clearInterval(intervalId);
  }, [queryClient, finalConfig.idleThreshold]);

  // Get recent activity insights
  const getActivityInsights = () => {
    const now = Date.now();
    const recentActivities = userActivityRef.current.filter(
      activity => now - activity.timestamp < finalConfig.activityWindow
    );

    return {
      recentActivityCount: recentActivities.length,
      isUserActive: now - lastActivityRef.current < finalConfig.idleThreshold,
      lastActivity: lastActivityRef.current,
      activities: recentActivities,
    };
  };

  return {
    recordActivity,
    getActivityInsights,
    isUserActive: () =>
      Date.now() - lastActivityRef.current < finalConfig.idleThreshold,
  };
}
