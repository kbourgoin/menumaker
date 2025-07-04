
export interface Dish {
  id: string;
  name: string;
  createdAt: string;
  cuisines: string[];
  sourceId?: string;
  lastMade?: string;
  timesCooked: number;
  userId: string;
  location?: string;
  lastComment?: string;
  tags: string[];
}

export interface MealHistory {
  id: string;
  dishId: string;
  date: string;
  notes?: string;
  userId: string;
}

export interface Source {
  id: string;
  name: string;
  type: 'book' | 'website';  // Removed 'document' from the type options
  description?: string;
  url?: string;
  createdAt: string;
  userId: string;
}

export type CuisineType = 
  | 'Italian' 
  | 'Mexican' 
  | 'American' 
  | 'Asian' 
  | 'Mediterranean' 
  | 'Indian' 
  | 'French'
  | 'Greek'
  | 'Thai'
  | 'Japanese'
  | 'Chinese'
  | 'Korean'
  | 'Middle Eastern'
  | 'Vietnamese'
  | 'Spanish'
  | 'Caribbean'
  | 'German'
  | 'British'
  | 'Fusion'
  | 'Other';

export type TagCategory = 'cuisine' | 'general';

export interface Tag {
  id: string;
  name: string;
  category: TagCategory;
  color?: string;
  description?: string;
  userId: string;
  createdAt: string;
}

export interface MealHistoryWithDish {
  id: string;
  dishId: string;
  date: string;
  notes?: string;
  userId: string;
  dish?: Dish;
}

export interface StatsData {
  totalDishes: number;
  totalTimesCooked: number;
  mostCooked?: {
    name: string;
    timesCooked: number;
  };
  topDishes: Dish[];
  cuisineBreakdown: Record<string, number>;
  recentlyCooked: Array<{
    date: string;
    dish: Dish | null;
    notes?: string;
  }>;
}
