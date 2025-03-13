
import { Source } from "@/types";
import { getStorageItem, saveStorageItem, generateId } from "./storageUtils";

// Get sources from localStorage or initialize with empty array
export const getSources = (): Source[] => {
  return getStorageItem<Source[]>("sources", []);
};

// Save sources to localStorage
export const saveSources = (sources: Source[]): void => {
  saveStorageItem("sources", sources);
};

// Add a new source and return the updated list
export const addSource = (source: Omit<Source, "id" | "createdAt">): Source[] => {
  const sources = getSources();
  const newSource: Source = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    ...source,
  };
  const updatedSources = [...sources, newSource];
  saveSources(updatedSources);
  return updatedSources;
};

// Get source by ID
export const getSourceById = (id: string): Source | undefined => {
  const sources = getSources();
  return sources.find((source) => source.id === id);
};

// Update source by ID
export const updateSource = (id: string, updates: Partial<Source>): Source[] => {
  const sources = getSources();
  const updatedSources = sources.map((source) => {
    if (source.id === id) {
      return {
        ...source,
        ...updates,
      };
    }
    return source;
  });
  saveSources(updatedSources);
  return updatedSources;
};

// Delete source by ID
export const deleteSource = (id: string): Source[] => {
  const sources = getSources();
  const updatedSources = sources.filter((source) => source.id !== id);
  saveSources(updatedSources);
  return updatedSources;
};

// Get dishes by source ID
export const getDishesBySourceId = (sourceId: string): any[] => {
  // This function would normally get dishes from localStorage
  // But we're now using Supabase for this, so this is just a placeholder
  return [];
};
