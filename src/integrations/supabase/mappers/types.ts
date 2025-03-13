
import { Database } from '../types';
import { Dish, MealHistory, Cookbook } from '@/types';

// Define types for the tables we've created - moved from client.ts
export type DBDish = Database['public']['Tables']['dishes']['Row'];
export type DBMealHistory = Database['public']['Tables']['meal_history']['Row'];
export type DBCookbook = Database['public']['Tables']['cookbooks']['Row'];

// Type for our materialized view
export type DishSummary = {
  id: string;
  name: string;
  createdat: string;
  cuisines: string[];
  source?: any;
  cookbook_id?: string;
  user_id: string;
  times_cooked: number;
  last_made?: string;
};
