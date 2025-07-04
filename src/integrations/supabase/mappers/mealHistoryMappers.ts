
import { Database } from '../types';
import { DBMealHistory } from './types';
import { MealHistory } from '@/types';

export const mapMealHistoryFromDB = (history: DBMealHistory): MealHistory => ({
  id: history.id,
  dishId: history.dishid,
  date: history.date,
  notes: history.notes || undefined,
  userId: history.user_id
});

export const mapMealHistoryToDB = (history: Partial<MealHistory>): Partial<Database['public']['Tables']['meal_history']['Insert']> => {
  // Ensure required fields are present when inserting a new meal history record
  if (history.dishId === undefined && !history.id) {
    throw new Error('DishId is required when creating a new meal history record');
  }
  
  return {
    id: history.id,
    dishid: history.dishId,
    date: history.date,
    notes: history.notes,
    user_id: history.userId
  };
};
