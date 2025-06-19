import { supabase } from "@/integrations/supabase/client";
import { CUISINES } from "@/components/dish-form/constants";

// Color mapping for cuisine tags (same as CuisineTag component)
const cuisineColors: Record<string, string> = {
  Italian: "bg-red-50 text-red-700 border-red-200",
  Mexican: "bg-green-50 text-green-700 border-green-200",
  American: "bg-blue-50 text-blue-700 border-blue-200",
  Asian: "bg-purple-50 text-purple-700 border-purple-200",
  Mediterranean: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Indian: "bg-orange-50 text-orange-700 border-orange-200",
  French: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Greek: "bg-sky-50 text-sky-700 border-sky-200",
  Thai: "bg-lime-50 text-lime-700 border-lime-200",
  Japanese: "bg-pink-50 text-pink-700 border-pink-200",
  Chinese: "bg-red-50 text-red-700 border-red-200",
  Korean: "bg-violet-50 text-violet-700 border-violet-200",
  "Middle Eastern": "bg-amber-50 text-amber-700 border-amber-200",
  Vietnamese: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Spanish: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Caribbean: "bg-teal-50 text-teal-700 border-teal-200",
  German: "bg-gray-50 text-gray-700 border-gray-200",
  British: "bg-slate-50 text-slate-700 border-slate-200",
  Fusion: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  Other: "bg-stone-50 text-stone-700 border-stone-200",
};

export interface MigrationStats {
  cuisineTagsCreated: number;
  dishesUpdated: number;
  dishTagRelationsCreated: number;
  errors: string[];
}

/**
 * Migrates cuisines from the old string array system to the new tag-based system
 * This should be run once to convert existing data
 */
export async function migrateCuisinesToTags(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    cuisineTagsCreated: 0,
    dishesUpdated: 0,
    dishTagRelationsCreated: 0,
    errors: []
  };

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    console.log(`Starting cuisine to tag migration for user: ${user.id}`);

    // Step 1: Create cuisine tags for all cuisines the user has used
    const { data: dishes, error: dishesError } = await supabase
      .from('dishes')
      .select('cuisines')
      .eq('user_id', user.id);

    if (dishesError) {
      throw new Error(`Failed to fetch dishes: ${dishesError.message}`);
    }

    // Get unique cuisines from user's dishes + their profile cuisines
    const { data: profile } = await supabase
      .from('profiles')
      .select('cuisines')
      .eq('id', user.id)
      .single();

    const allUserCuisines = new Set<string>();
    
    // Add cuisines from dishes
    dishes?.forEach(dish => {
      dish.cuisines?.forEach(cuisine => allUserCuisines.add(cuisine));
    });

    // Add cuisines from profile
    profile?.cuisines?.forEach(cuisine => allUserCuisines.add(cuisine));

    // Add default cuisines if user doesn't have any custom ones
    if (allUserCuisines.size === 0) {
      CUISINES.forEach(cuisine => allUserCuisines.add(cuisine));
    }

    console.log(`Found ${allUserCuisines.size} unique cuisines to migrate`);

    // Step 2: Check which cuisine tags already exist
    const { data: existingTags } = await supabase
      .from('tags')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('category', 'cuisine');

    const existingCuisineNames = new Set(existingTags?.map(tag => tag.name) || []);
    
    // Only create tags that don't already exist
    const cuisineTagsToCreate = Array.from(allUserCuisines)
      .filter(cuisine => !existingCuisineNames.has(cuisine))
      .map(cuisine => ({
        name: cuisine,
        category: 'cuisine' as const,
        color: cuisineColors[cuisine] || "bg-gray-100 text-gray-800 border-gray-200",
        user_id: user.id,
        created_at: new Date().toISOString()
      }));

    let allCuisineTags = existingTags || [];

    if (cuisineTagsToCreate.length > 0) {
      const { data: createdTags, error: tagsError } = await supabase
        .from('tags')
        .insert(cuisineTagsToCreate)
        .select('id, name');

      if (tagsError) {
        throw new Error(`Failed to create cuisine tags: ${tagsError.message}`);
      }

      allCuisineTags = [...allCuisineTags, ...(createdTags || [])];
    }

    stats.cuisineTagsCreated = cuisineTagsToCreate.length;
    console.log(`Created ${stats.cuisineTagsCreated} new cuisine tags (${allCuisineTags.length} total)`);

    // Step 3: Create a mapping from cuisine names to tag IDs
    const cuisineToTagId = new Map<string, string>();
    allCuisineTags.forEach(tag => {
      cuisineToTagId.set(tag.name, tag.id);
    });

    // Step 4: For each dish, create dish_tag relationships for its cuisines
    const dishTagRelations: Array<{ dish_id: string; tag_id: string }> = [];

    const { data: allDishes, error: allDishesError } = await supabase
      .from('dishes')
      .select('id, cuisines')
      .eq('user_id', user.id);

    if (allDishesError) {
      throw new Error(`Failed to fetch all dishes: ${allDishesError.message}`);
    }

    allDishes?.forEach(dish => {
      dish.cuisines?.forEach(cuisine => {
        const tagId = cuisineToTagId.get(cuisine);
        if (tagId) {
          dishTagRelations.push({
            dish_id: dish.id,
            tag_id: tagId
          });
        }
      });
    });

    // Insert dish-tag relationships
    if (dishTagRelations.length > 0) {
      const { error: relationsError } = await supabase
        .from('dish_tags')
        .insert(dishTagRelations);

      if (relationsError) {
        stats.errors.push(`Failed to create some dish-tag relations: ${relationsError.message}`);
      } else {
        stats.dishTagRelationsCreated = dishTagRelations.length;
        console.log(`Created ${stats.dishTagRelationsCreated} dish-tag relationships`);
      }
    }

    stats.dishesUpdated = allDishes?.length || 0;

    console.log("Migration completed successfully!", stats);
    return stats;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    stats.errors.push(errorMessage);
    console.error("Migration failed:", error);
    return stats;
  }
}

/**
 * Checks if the migration has already been run by looking for cuisine tags
 */
export async function checkMigrationStatus(): Promise<{ needsMigration: boolean; cuisineTagCount: number }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { needsMigration: true, cuisineTagCount: 0 };
    }

    const { data: cuisineTags, error } = await supabase
      .from('tags')
      .select('id')
      .eq('user_id', user.id)
      .eq('category', 'cuisine');

    if (error) {
      console.error("Error checking migration status:", error);
      return { needsMigration: true, cuisineTagCount: 0 };
    }

    const cuisineTagCount = cuisineTags?.length || 0;
    return {
      needsMigration: cuisineTagCount === 0,
      cuisineTagCount
    };
  } catch (error) {
    console.error("Error checking migration status:", error);
    return { needsMigration: true, cuisineTagCount: 0 };
  }
}