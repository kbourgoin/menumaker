
import { Database } from '../types';
import { DBCookbook } from './types';
import { Cookbook } from '@/types';

export const mapCookbookFromDB = (cookbook: DBCookbook): Cookbook => ({
  id: cookbook.id,
  name: cookbook.name,
  author: cookbook.author || undefined,
  description: cookbook.description || undefined,
  createdAt: cookbook.createdat,
  user_id: cookbook.user_id
});

export const mapCookbookToDB = (cookbook: Partial<Cookbook>): Partial<Database['public']['Tables']['cookbooks']['Insert']> => {
  // Ensure required fields are present when inserting a new cookbook
  if (cookbook.name === undefined && !cookbook.id) {
    throw new Error('Name is required when creating a new cookbook');
  }
  
  return {
    id: cookbook.id,
    name: cookbook.name,
    author: cookbook.author,
    description: cookbook.description,
    createdat: cookbook.createdAt,
    user_id: cookbook.user_id
  };
};
