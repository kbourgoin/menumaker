
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dish_id, increment_by = 1 } = await req.json();
    
    if (!dish_id) {
      throw new Error("dish_id is required");
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current count
    const { data: dish, error: fetchError } = await supabase
      .from('dishes')
      .select('timesCooked')
      .eq('id', dish_id)
      .single();

    if (fetchError) {
      throw new Error(`Error fetching dish: ${fetchError.message}`);
    }

    if (!dish) {
      throw new Error(`Dish with ID ${dish_id} not found`);
    }

    // Update the count
    const newCount = dish.timesCooked + increment_by;
    const { data, error: updateError } = await supabase
      .from('dishes')
      .update({ timesCooked: newCount })
      .eq('id', dish_id)
      .select('timesCooked')
      .single();

    if (updateError) {
      throw new Error(`Error updating dish: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, timesCooked: data.timesCooked }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
