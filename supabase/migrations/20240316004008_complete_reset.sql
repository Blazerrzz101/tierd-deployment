-- Drop everything first
DROP TABLE IF EXISTS public.product_rankings CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;

-- Recreate products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    url_slug TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index on url_slug
CREATE UNIQUE INDEX products_url_slug_idx ON public.products(url_slug);

-- Create the product_rankings table
CREATE TABLE public.product_rankings (
    product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    net_score INTEGER DEFAULT 0,
    rank INTEGER DEFAULT 0
);

-- Create index for performance
CREATE INDEX idx_product_rankings_rank ON public.product_rankings(rank);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_rankings ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
CREATE POLICY "Enable read access for all users" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.product_rankings
    FOR SELECT USING (true);

-- Insert initial products
INSERT INTO public.products (name, description, category, price, url_slug, image_url) VALUES
('Keychron K2', 'Wireless mechanical keyboard with hot-swappable switches and RGB backlight', 'gaming-keyboards', 89.99, 'keychron-k2', 'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6'),
('Ducky One 3', 'Premium mechanical keyboard with PBT keycaps and multiple switch options', 'gaming-keyboards', 119.99, 'ducky-one-3', 'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6'),
('GMMK Pro', 'Customizable premium mechanical keyboard with rotary knob', 'gaming-keyboards', 169.99, 'gmmk-pro', 'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6'),
('Royal Kludge RK84', 'Compact wireless mechanical keyboard with RGB lighting', 'gaming-keyboards', 79.99, 'rk84', 'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6'),
('Leopold FC660M', 'Minimalist mechanical keyboard with premium build quality', 'gaming-keyboards', 109.99, 'leopold-fc660m', 'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6');

INSERT INTO public.products (name, description, category, price, url_slug, image_url) VALUES
('Logitech G Pro X Superlight', 'Ultra-lightweight wireless gaming mouse with HERO sensor', 'gaming-mice', 149.99, 'gpro-x-superlight', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46'),
('Razer Viper Ultimate', 'Ambidextrous wireless gaming mouse with optical switches', 'gaming-mice', 129.99, 'viper-ultimate', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46'),
('Zowie EC2', 'Ergonomic esports mouse with flawless sensor', 'gaming-mice', 69.99, 'zowie-ec2', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46'),
('Pulsar X2', 'Ultra-lightweight symmetrical gaming mouse', 'gaming-mice', 89.99, 'pulsar-x2', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46'),
('Endgame Gear XM1r', 'Professional gaming mouse with low click latency', 'gaming-mice', 79.99, 'xm1r', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46');

INSERT INTO public.products (name, description, category, price, url_slug, image_url) VALUES
('HyperX Cloud II', 'Premium gaming headset with virtual 7.1 surround sound', 'gaming-headsets', 99.99, 'cloud-2', 'https://images.unsplash.com/photo-1599669454699-248893623440'),
('SteelSeries Arctis Pro', 'High-fidelity gaming audio with premium speakers', 'gaming-headsets', 179.99, 'arctis-pro', 'https://images.unsplash.com/photo-1599669454699-248893623440'),
('Sennheiser PC38X', 'Open-back gaming headset with natural sound', 'gaming-headsets', 169.99, 'pc38x', 'https://images.unsplash.com/photo-1599669454699-248893623440'),
('Logitech G Pro X', 'Professional gaming headset with Blue VO!CE technology', 'gaming-headsets', 129.99, 'gpro-x-headset', 'https://images.unsplash.com/photo-1599669454699-248893623440'),
('Beyerdynamic MMX 300', 'Premium audiophile gaming headset', 'gaming-headsets', 299.99, 'mmx-300', 'https://images.unsplash.com/photo-1599669454699-248893623440');

INSERT INTO public.products (name, description, category, price, url_slug, image_url) VALUES
('LG 27GP850-B', '27" QHD Nano IPS gaming monitor with 165Hz refresh rate', 'gaming-monitors', 449.99, 'lg-27gp850', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf'),
('ASUS ROG Swift PG279QM', '27" QHD gaming monitor with G-SYNC and HDR', 'gaming-monitors', 699.99, 'pg279qm', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf'),
('Samsung Odyssey G7', '27" curved QHD gaming monitor with 240Hz refresh rate', 'gaming-monitors', 599.99, 'odyssey-g7', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf'),
('Dell S2721DGF', '27" QHD gaming monitor with excellent color accuracy', 'gaming-monitors', 379.99, 's2721dgf', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf'),
('ViewSonic XG270QG', '27" QHD IPS gaming monitor with G-SYNC', 'gaming-monitors', 499.99, 'xg270qg', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf');

INSERT INTO public.products (name, description, category, price, url_slug, image_url) VALUES
('Artisan FX Zero', 'Premium Japanese mousepad with unique weave pattern', 'gaming-mousepads', 49.99, 'fx-zero', 'https://images.unsplash.com/photo-1616788494672-ec7ca25fdda9'),
('LGG Saturn Pro', 'Control-focused premium mousepad with stitched edges', 'gaming-mousepads', 29.99, 'saturn-pro', 'https://images.unsplash.com/photo-1616788494672-ec7ca25fdda9'),
('Aqua Control+', 'Hybrid mousepad with unique surface texture', 'gaming-mousepads', 34.99, 'aqua-control', 'https://images.unsplash.com/photo-1616788494672-ec7ca25fdda9'),
('Zowie G-SR-SE', 'Esports-focused control mousepad', 'gaming-mousepads', 39.99, 'gsr-se', 'https://images.unsplash.com/photo-1616788494672-ec7ca25fdda9'),
('Pulsar ParaControl', 'Premium control mousepad with unique surface coating', 'gaming-mousepads', 24.99, 'paracontrol', 'https://images.unsplash.com/photo-1616788494672-ec7ca25fdda9');

-- Insert initial rankings
INSERT INTO public.product_rankings (product_id, upvotes, downvotes, net_score, rank)
SELECT 
    id as product_id,
    FLOOR(RANDOM() * 100)::int as upvotes,
    FLOOR(RANDOM() * 20)::int as downvotes,
    0 as net_score,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY RANDOM()) as rank
FROM public.products; 