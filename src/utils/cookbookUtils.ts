
import { Cookbook } from "@/types";
import { getStorageItem, saveStorageItem, generateId } from "./storageUtils";
import { getDishes, saveDishes } from "./dishUtils";

// Get cookbooks from localStorage or initialize with empty array
export const getCookbooks = (): Cookbook[] => {
  return getStorageItem<Cookbook[]>("cookbooks", []);
};

// Save cookbooks to localStorage
export const saveCookbooks = (cookbooks: Cookbook[]): void => {
  saveStorageItem("cookbooks", cookbooks);
};

// Add a new cookbook
export const addCookbook = (cookbook: Omit<Cookbook, "id" | "createdAt">): Cookbook[] => {
  const cookbooks = getCookbooks();
  const newCookbook: Cookbook = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    ...cookbook,
  };
  const updatedCookbooks = [...cookbooks, newCookbook];
  saveCookbooks(updatedCookbooks);
  return updatedCookbooks;
};

// Update a cookbook
export const updateCookbook = (id: string, updates: Partial<Cookbook>): Cookbook[] => {
  const cookbooks = getCookbooks();
  const updatedCookbooks = cookbooks.map((cookbook) => {
    if (cookbook.id === id) {
      return {
        ...cookbook,
        ...updates,
      };
    }
    return cookbook;
  });
  saveCookbooks(updatedCookbooks);
  return updatedCookbooks;
};

// Delete a cookbook - updated to clear the cookbookId reference
export const deleteCookbook = (id: string): Cookbook[] => {
  const cookbooks = getCookbooks();
  const updatedCookbooks = cookbooks.filter((cookbook) => cookbook.id !== id);
  saveCookbooks(updatedCookbooks);
  
  // Update dish references - now using the direct cookbookId field
  const dishes = getDishes();
  const updatedDishes = dishes.map((dish) => {
    if (dish.cookbookId === id) {
      return {
        ...dish,
        cookbookId: undefined
      };
    }
    return dish;
  });
  saveDishes(updatedDishes);
  
  return updatedCookbooks;
};

// Get cookbook by ID
export const getCookbookById = (id: string): Cookbook | undefined => {
  const cookbooks = getCookbooks();
  return cookbooks.find((cookbook) => cookbook.id === id);
};
