
export interface Dish {
  id: string;
  name: string;
  createdAt: string;
  cuisines: string[];
  source?: {
    type: 'url' | 'book' | 'none';
    value: string;
    page?: number;
    bookId?: string; // New field to link to a cookbook
  };
  lastMade?: string;
  timesCooked: number;
}

export interface MealHistory {
  id: string;
  dishId: string;
  date: string;
  notes?: string;
}

export interface Cookbook {
  id: string;
  name: string;
  author?: string;
  description?: string;
  createdAt: string;
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
