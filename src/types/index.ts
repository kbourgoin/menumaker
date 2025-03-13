
export interface Dish {
  id: string;
  name: string;
  createdAt: string;
  cuisines: string[];
  source?: {
    type: 'url' | 'book' | 'none';
    value: string;
    page?: number;
  };
  sourceId?: string; // Updated: reference to the sources table
  lastMade?: string;
  timesCooked: number;
  user_id: string;
}

export interface MealHistory {
  id: string;
  dishId: string;
  date: string;
  notes?: string;
  user_id: string;
}

export interface Source {
  id: string;
  name: string;
  location?: string;
  type: 'book' | 'website' | 'document';
  description?: string;
  createdAt: string;
  user_id: string;
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
