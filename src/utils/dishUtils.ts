
import { Dish } from "@/types";

export const getSourceInfo = (dish: Dish): string => {
  if (dish.sourceId) {
    // Handle source references
    return dish.sourceId;
  }
  
  return 'No source';
};

export const formatDishName = (dish: Dish): string => {
  return dish.name;
};

export const formatCuisines = (dish: Dish): string => {
  return dish.cuisines.join(', ');
};

export const getLastCookedDate = (dish: Dish): string => {
  return dish.lastMade ? new Date(dish.lastMade).toLocaleDateString() : 'Never';
};

export const getTimesCooked = (dish: Dish): number => {
  return dish.timesCooked || 0;
};

export const sortDishes = (dishes: Dish[], sortBy: string): Dish[] => {
  return [...dishes].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'lastCooked':
        if (!a.lastMade && !b.lastMade) return 0;
        if (!a.lastMade) return 1;
        if (!b.lastMade) return -1;
        return new Date(b.lastMade).getTime() - new Date(a.lastMade).getTime();
      case 'timesCooked':
        return (b.timesCooked || 0) - (a.timesCooked || 0);
      case 'cuisine':
        return a.cuisines[0]?.localeCompare(b.cuisines[0] || '') || 0;
      default:
        return 0;
    }
  });
};

export const filterDishes = (dishes: Dish[], filters: {
  search?: string;
  cuisines?: string[];
  sourceId?: string;
}): Dish[] => {
  return dishes.filter(dish => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesName = dish.name.toLowerCase().includes(searchLower);
      const matchesCuisine = dish.cuisines.some(cuisine => 
        cuisine.toLowerCase().includes(searchLower)
      );
      if (!matchesName && !matchesCuisine) return false;
    }

    // Cuisine filter
    if (filters.cuisines && filters.cuisines.length > 0) {
      if (!dish.cuisines.some(cuisine => filters.cuisines?.includes(cuisine))) {
        return false;
      }
    }

    // Source filter
    if (filters.sourceId) {
      if (dish.sourceId !== filters.sourceId) {
        return false;
      }
    }

    return true;
  });
};

export const validateDish = (dish: Partial<Dish>): string[] => {
  const errors: string[] = [];

  if (!dish.name) {
    errors.push('Name is required');
  }

  if (!dish.cuisines || dish.cuisines.length === 0) {
    errors.push('At least one cuisine must be selected');
  }

  return errors;
};
