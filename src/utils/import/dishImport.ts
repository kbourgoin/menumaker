
import { supabase } from "@/integrations/supabase/client";

// Find or create a cookbook for a dish source
export const findOrCreateCookbook = async (cookbookName: string, userId: string) => {
  console.log(`Looking for cookbook '${cookbookName}'`);
  
  const { data: existingCookbooks, error: cookbookError } = await supabase
    .from('cookbooks')
    .select('id, name')
    .ilike('name', `%${cookbookName}%`)
    .eq('user_id', userId);
  
  if (cookbookError) {
    console.error(`Error finding cookbook '${cookbookName}':`, cookbookError);
    return null;
  }
  
  // Check for exact match
  if (existingCookbooks && existingCookbooks.length > 0) {
    const exactCookbook = existingCookbooks.find(c => 
      c.name.toLowerCase() === cookbookName.toLowerCase()
    );
    
    if (exactCookbook) {
      console.log(`Using existing cookbook '${exactCookbook.name}' with ID ${exactCookbook.id}`);
      return exactCookbook.id;
    }
    
    // Use the first match if no exact match
    console.log(`Using existing cookbook '${existingCookbooks[0].name}' with ID ${existingCookbooks[0].id}`);
    return existingCookbooks[0].id;
  }
  
  // Create new cookbook
  console.log(`Creating new cookbook '${cookbookName}'`);
  const { data: newCookbook, error: newCookbookError } = await supabase
    .from('cookbooks')
    .insert({ 
      name: cookbookName,
      user_id: userId,
      createdat: new Date().toISOString()
    })
    .select('id')
    .single();
    
  if (newCookbookError) {
    console.error(`Error creating cookbook '${cookbookName}':`, newCookbookError);
    return null;
  }
  
  console.log(`Created cookbook '${cookbookName}' with ID ${newCookbook.id}`);
  return newCookbook.id;
};

// Find or create a dish by name
export const findOrCreateDish = async (
  dishName: string, 
  date: string, 
  source: any, 
  userId: string
) => {
  // Search for existing dishes by name directly from dishes table
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
  
  // Create a new dish - directly insert into dishes table, not the materialized view
  console.log(`Creating new dish '${dishName}'`);
  
  // Prepare the dish data
  const dishData = {
    name: dishName,
    createdat: date,
    cuisines: ['Other'], // Default cuisine
    source,
    user_id: userId
  };
  
  const { data: newDish, error: newDishError } = await supabase
    .from('dishes')
    .insert(dishData)
    .select('id')
    .single();
    
  if (newDishError) {
    console.error(`Error creating dish '${dishName}':`, newDishError);
    return null;
  }
  
  console.log(`Created new dish '${dishName}' with ID ${newDish.id}`);
  return newDish.id;
};
