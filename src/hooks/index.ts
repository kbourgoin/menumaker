// Export all hooks for easier imports - consolidated architecture

// Core domain hooks
export * from "./dish";
export * from "./source";
export * from "./meal-history";

// Feature-specific hooks
export * from "./auth";
export * from "./stats";
export * from "./ui";
export * from "./data";
export * from "./import-export";
export * from "./tags";

// Legacy hooks (to be migrated)
export * from "./use-mobile";
export * from "./use-toast";
export * from "./useWeeklyMenu";
