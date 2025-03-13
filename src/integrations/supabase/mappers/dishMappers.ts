
import { Database, Json } from '../types';
import { DBDish, DishSummary } from './types';
import { Dish } from '@/types';

// Mapping functions to convert between database and client formats
export const mapDishFromDB = (dish: DBDish, mealHistory?: any[]): Dish => {
  // Default values for derived fields
  let timesCooked = 0;
  let lastMade: string | undefined = undefined;
  
  // If meal history is provided, use it to calculate timesCooked and lastMade
  if (mealHistory && mealHistory.length > 0) {
    timesCooked = mealHistory.length;
    
    // Find the most recent meal date
    const sortedDates = [...mealHistory].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    if (sortedDates.length > 0) {
      lastMade = sortedDates[0].date;
    }
  }
  
  return {
    id: dish.id,
    name: dish.name,
    createdAt: dish.createdat,
    cuisines: dish.cuisines,
    source: dish.source as any,
    sourceId: dish.source_id, // Map from the direct foreign key
    location: dish.location, // Include the location field
    lastMade,  // Derived value
    timesCooked, // Derived value
    user_id: dish.user_id
  };
};

// Updated function to map from our materialized view with more robust source handling
export const mapDishFromSummary = (summary: DishSummary): Dish => {
  // Ensure source property is properly formatted with more robust error handling
  let formattedSource = undefined;
  
  try {
    if (summary.source) {
      // Parse the source if it's a string (sometimes JSON comes as a string from the database)
      const sourceData = typeof summary.source === 'string' 
        ? JSON.parse(summary.source)
        : summary.source;
      
      // Ensure source has the correct structure for the Dish type
      if (typeof sourceData === 'object') {
        formattedSource = {
          type: sourceData.type === 'url' || sourceData.type === 'book' ? sourceData.type : 'none',
          value: sourceData.value || '',
          ...(sourceData.page !== undefined ? { page: sourceData.page } : {})
        };
      } else {
        // Fallback for non-object source
        formattedSource = { type: 'none', value: String(sourceData) };
      }
    } else {
      // Default source when null/undefined
      formattedSource = { type: 'none', value: '' };
    }
  } catch (error) {
    console.error("Error formatting source data:", error);
    // Default to a safe empty source object if parsing fails
    formattedSource = { type: 'none', value: '' };
  }
  
  return {
    id: summary.id,
    name: summary.name,
    createdAt: summary.createdat,
    cuisines: summary.cuisines,
    source: formattedSource,
    sourceId: summary.source_id, // Map the direct foreign key
    location: summary.location, // Include the location field
    lastMade: summary.last_made,
    timesCooked: summary.times_cooked || 0,
    user_id: summary.user_id
  };
};

export const mapDishToDB = (dish: Partial<Dish>): Partial<Database['public']['Tables']['dishes']['Insert']> => {
  // Ensure required fields are present when inserting a new dish
  if (dish.name === undefined && !dish.id) {
    throw new Error('Name is required when creating a new dish');
  }
  
  return {
    id: dish.id,
    name: dish.name,
    createdat: dish.createdAt,
    cuisines: dish.cuisines,
    source: dish.source as any,
    source_id: dish.sourceId, // Map to the database column name
    location: dish.location, // Map the location field
    user_id: dish.user_id
  };
};
