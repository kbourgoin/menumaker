
import { Database } from '../types';
import { Source } from '@/types';

export type DBSource = Database['public']['Tables']['sources']['Row'] & {
  url?: string;
};

export const mapSourceFromDB = (source: DBSource): Source => ({
  id: source.id,
  name: source.name,
  type: source.type === 'book' || source.type === 'website' 
    ? source.type 
    : 'book', // Convert any old 'document' type to 'book'
  description: source.description || undefined,
  url: source.url || undefined,
  createdAt: source.created_at,
  userId: source.user_id
});

export const mapSourceToDB = (source: Partial<Source>): Partial<Database['public']['Tables']['sources']['Insert']> & { url?: string } => {
  // Ensure required fields are present when inserting a new source
  if (source.name === undefined && !source.id) {
    throw new Error('Name is required when creating a new source');
  }
  
  if (source.type === undefined && !source.id) {
    throw new Error('Type is required when creating a new source');
  }
  
  return {
    id: source.id,
    name: source.name,
    type: source.type,
    description: source.description,
    url: source.url,
    created_at: source.createdAt,
    user_id: source.userId
  };
};
