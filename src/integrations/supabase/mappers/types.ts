import { Database } from "../types";
import { Dish, MealHistory, Source } from "@/types";

// Define types for the tables we've created - moved from client.ts
export type DBDish = Database["public"]["Tables"]["dishes"]["Row"];
export type DBMealHistory = Database["public"]["Tables"]["meal_history"]["Row"];
export type DBSource = Database["public"]["Tables"]["sources"]["Row"];

// Type for our materialized view
export type DishSummary = {
  id: string;
  name: string;
  createdat: string;
  cuisines: string[];
  source_id?: string;
  location?: string;
  user_id: string;
  times_cooked: number;
  last_made?: string;
  last_comment?: string;
  tags: string[];
};
