-- Create the product_rankings table
CREATE TABLE IF NOT EXISTS public.product_rankings (
    product_id UUID PRIMARY KEY REFERENCES public.products(id),
    upvotes INTEGER NOT NULL DEFAULT 0,
    downvotes INTEGER NOT NULL DEFAULT 0,
    net_score INTEGER NOT NULL DEFAULT 0,
    rank INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.product_rankings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Enable read access for all users" ON public.product_rankings
    FOR SELECT
    USING (true);

-- Grant access to anonymous users
GRANT SELECT ON public.product_rankings TO anon;

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION update_product_rankings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_rankings_timestamp
    BEFORE UPDATE ON public.product_rankings
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rankings_timestamp(); 