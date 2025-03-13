
import { supabase } from "@/integrations/supabase/client";

// Find or create a source for a dish
export const findOrCreateSource = async (sourceName: string, sourceType: 'book' | 'website' | 'document', location: string | null, userId: string) => {
  console.log(`Looking for source '${sourceName}' of type ${sourceType}`);
  
  const { data: existingSources, error: sourceError } = await supabase
    .from('sources')
    .select('id, name, type')
    .ilike('name', `%${sourceName}%`)
    .eq('user_id', userId);
  
  if (sourceError) {
    console.error(`Error finding source '${sourceName}':`, sourceError);
    return null;
  }
  
  // Check for exact match with the same type
  if (existingSources && existingSources.length > 0) {
    const exactSource = existingSources.find(s => 
      s.name.toLowerCase() === sourceName.toLowerCase() && s.type === sourceType
    );
    
    if (exactSource) {
      console.log(`Using existing source '${exactSource.name}' with ID ${exactSource.id}`);
      return exactSource.id;
    }
    
    // Use the first match of the same type if no exact match
    const sameTypeSource = existingSources.find(s => s.type === sourceType);
    if (sameTypeSource) {
      console.log(`Using existing source '${sameTypeSource.name}' with ID ${sameTypeSource.id}`);
      return sameTypeSource.id;
    }
  }
  
  // Create new source
  console.log(`Creating new source '${sourceName}' of type ${sourceType}`);
  const { data: newSource, error: newSourceError } = await supabase
    .from('sources')
    .insert({ 
      name: sourceName,
      type: sourceType,
      location: location,
      user_id: userId,
      created_at: new Date().toISOString()
    })
    .select('id')
    .single();
    
  if (newSourceError) {
    console.error(`Error creating source '${sourceName}':`, newSourceError);
    return null;
  }
  
  console.log(`Created source '${sourceName}' with ID ${newSource.id}`);
  return newSource.id;
};

// Find or create a dish by name - COMPLETELY avoid the dish_summary view
// Updated to handle the source_id as a direct column
export const findOrCreateDish = async (
  dishName: string, 
  date: string, 
  source: any, 
  sourceId: string | null | undefined,
  userId: string
) => {
  try {
    // Search for existing dishes by name directly from dishes table only
    const { data: existingDishes, error: dishError } = await supabase
      .from('dishes')
      .select('id, name')
      .ilike('name', `%${dishName.substring(0, Math.min(dishName.length, 10))}%`)
      .eq('user_id', userId);
    
    if (dishError) {
      console.error(`Error finding dish '${dishName}':`, dishError);
      return null;
    }
    
    console.log(`Search for '${dishName}' found ${existingDishes?.length || 0} potential matches`);
    
    // Check for an exact match (case insensitive)
    if (existingDishes && existingDishes.length > 0) {
      const exactDish = existingDishes.find(d => 
        d.name.toLowerCase() === dishName.toLowerCase()
      );
      
      if (exactDish) {
        console.log(`Found exact match for dish '${dishName}' with ID ${exactDish.id}`);
        return exactDish.id;
      }
    }
    
    // Create a new dish - bypass the materialized view completely
    console.log(`Creating new dish '${dishName}'`);
    
    // Prepare the dish data - ensure source is properly formatted
    let formattedSource = source;
    if (typeof source === 'string') {
      try {
        formattedSource = JSON.parse(source);
      } catch {
        formattedSource = { type: 'none', value: source };
      }
    } else if (!source || !source.type) {
      formattedSource = { type: 'none', value: '' };
    }
    
    // Create dish data with the direct source_id relationship
    const dishData = {
      name: dishName,
      createdat: date,
      cuisines: ['Other'], // Default cuisine
      source: formattedSource,
      user_id: userId,
      source_id: sourceId || null
    };
    
    // Insert directly into dishes table and avoid using single() which can cause errors
    const { data: newDish, error: newDishError } = await supabase
      .from('dishes')
      .insert(dishData)
      .select('id');
    
    if (newDishError) {
      console.error(`Error creating dish '${dishName}':`, newDishError);
      return null;
    }
    
    if (!newDish || newDish.length === 0) {
      console.error(`Failed to create dish '${dishName}': No ID returned`);
      return null;
    }
    
    console.log(`Created new dish '${dishName}' with ID ${newDish[0].id}`);
    return newDish[0].id;
  } catch (error) {
    console.error(`Unexpected error in findOrCreateDish for '${dishName}':`, error);
    return null;
  }
};
