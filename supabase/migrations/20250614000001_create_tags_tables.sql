-- Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(name, user_id)
);

-- Create dish_tags junction table
CREATE TABLE IF NOT EXISTS public.dish_tags (
    dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (dish_id, tag_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
CREATE INDEX IF NOT EXISTS idx_dish_tags_dish_id ON public.dish_tags(dish_id);
CREATE INDEX IF NOT EXISTS idx_dish_tags_tag_id ON public.dish_tags(tag_id);

-- Enable RLS (Row Level Security) for tags table
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tags table
CREATE POLICY "Users can view their own tags" ON public.tags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags" ON public.tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" ON public.tags
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" ON public.tags
    FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS for dish_tags table
ALTER TABLE public.dish_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dish_tags table
CREATE POLICY "Users can view dish_tags for their dishes" ON public.dish_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.dishes 
            WHERE dishes.id = dish_tags.dish_id 
            AND dishes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert dish_tags for their dishes" ON public.dish_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.dishes 
            WHERE dishes.id = dish_tags.dish_id 
            AND dishes.user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM public.tags 
            WHERE tags.id = dish_tags.tag_id 
            AND tags.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete dish_tags for their dishes" ON public.dish_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.dishes 
            WHERE dishes.id = dish_tags.dish_id 
            AND dishes.user_id = auth.uid()
        )
    );