-- Insert Keyboards
INSERT INTO public.products (name, description, category, price, url_slug, image_url) VALUES
('Keychron K2', 'Wireless mechanical keyboard with hot-swappable switches and RGB backlight', 'keyboards', 89.99, 'keychron-k2', 'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6'),
('Ducky One 3', 'Premium mechanical keyboard with PBT keycaps and multiple switch options', 'keyboards', 119.99, 'ducky-one-3', 'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6'),
('GMMK Pro', 'Customizable premium mechanical keyboard with rotary knob', 'keyboards', 169.99, 'gmmk-pro', 'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6'),
('Royal Kludge RK84', 'Compact wireless mechanical keyboard with RGB lighting', 'keyboards', 79.99, 'rk84', 'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6'),
('Leopold FC660M', 'Minimalist mechanical keyboard with premium build quality', 'keyboards', 109.99, 'leopold-fc660m', 'https://images.unsplash.com/photo-1601445638532-3c6f6c3aa1d6');

-- Insert Mice
INSERT INTO public.products (name, description, category, price, url_slug, image_url) VALUES
('Logitech G Pro X Superlight', 'Ultra-lightweight wireless gaming mouse with HERO sensor', 'gaming-mice', 149.99, 'logitech-g-pro-x-superlight', 'https://gaming-gear.com/images/mice/gpro-x-superlight.webp'),
('Razer Viper Ultimate', 'Ambidextrous wireless gaming mouse with optical switches', 'gaming-mice', 129.99, 'razer-viper-ultimate', 'https://gaming-gear.com/images/mice/viper-ultimate.webp'),
('Zowie EC2', 'Ergonomic esports mouse with flawless sensor', 'gaming-mice', 69.99, 'zowie-ec2-mouse', 'https://gaming-gear.com/images/mice/zowie-ec2.webp'),
('Pulsar X2', 'Ultra-lightweight symmetrical gaming mouse', 'gaming-mice', 89.99, 'pulsar-x2-mouse', 'https://gaming-gear.com/images/mice/pulsar-x2.webp'),
('Endgame Gear XM1r', 'Professional gaming mouse with low click latency', 'gaming-mice', 79.99, 'endgame-xm1r', 'https://gaming-gear.com/images/mice/xm1r.webp');

-- Insert Headsets
INSERT INTO public.products (name, description, category, price, url_slug, image_url) VALUES
('HyperX Cloud II', 'Premium gaming headset with virtual 7.1 surround sound', 'headsets', 99.99, 'cloud-2', 'https://images.unsplash.com/photo-1599669454699-248893623440'),
('SteelSeries Arctis Pro', 'High-fidelity gaming audio with premium speakers', 'headsets', 179.99, 'arctis-pro', 'https://images.unsplash.com/photo-1599669454699-248893623440'),
('Sennheiser PC38X', 'Open-back gaming headset with natural sound', 'headsets', 169.99, 'pc38x', 'https://images.unsplash.com/photo-1599669454699-248893623440'),
('Logitech G Pro X', 'Professional gaming headset with Blue VO!CE technology', 'headsets', 129.99, 'gpro-x-headset', 'https://images.unsplash.com/photo-1599669454699-248893623440'),
('Beyerdynamic MMX 300', 'Premium audiophile gaming headset', 'headsets', 299.99, 'mmx-300', 'https://images.unsplash.com/photo-1599669454699-248893623440');

-- Insert Monitors
INSERT INTO public.products (name, description, category, price, url_slug, image_url) VALUES
('LG 27GP850-B', '27" QHD Nano IPS gaming monitor with 165Hz refresh rate', 'monitors', 449.99, 'lg-27gp850', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf'),
('ASUS ROG Swift PG279QM', '27" QHD gaming monitor with G-SYNC and HDR', 'monitors', 699.99, 'pg279qm', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf'),
('Samsung Odyssey G7', '27" curved QHD gaming monitor with 240Hz refresh rate', 'monitors', 599.99, 'odyssey-g7', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf'),
('Dell S2721DGF', '27" QHD gaming monitor with excellent color accuracy', 'monitors', 379.99, 's2721dgf', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf'),
('ViewSonic XG270QG', '27" QHD IPS gaming monitor with G-SYNC', 'monitors', 499.99, 'xg270qg', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf');

-- Insert Mousepads
INSERT INTO public.products (name, description, category, price, url_slug, image_url) VALUES
('Artisan FX Zero', 'Premium Japanese mousepad with unique weave pattern', 'mousepads', 49.99, 'fx-zero', 'https://images.unsplash.com/photo-1616788494672-ec7ca25fdda9'),
('LGG Saturn Pro', 'Control-focused premium mousepad with stitched edges', 'mousepads', 29.99, 'saturn-pro', 'https://images.unsplash.com/photo-1616788494672-ec7ca25fdda9'),
('Aqua Control+', 'Hybrid mousepad with unique surface texture', 'mousepads', 34.99, 'aqua-control', 'https://images.unsplash.com/photo-1616788494672-ec7ca25fdda9'),
('Zowie G-SR-SE', 'Esports-focused control mousepad', 'mousepads', 39.99, 'gsr-se', 'https://images.unsplash.com/photo-1616788494672-ec7ca25fdda9'),
('Pulsar ParaControl', 'Premium control mousepad with unique surface coating', 'mousepads', 24.99, 'paracontrol', 'https://images.unsplash.com/photo-1616788494672-ec7ca25fdda9');

-- Initialize product rankings
INSERT INTO public.product_rankings (product_id, upvotes, downvotes, net_score, rank)
SELECT 
    id,
    FLOOR(RANDOM() * 100)::int as upvotes,
    FLOOR(RANDOM() * 20)::int as downvotes,
    0 as net_score,
    0 as rank
FROM public.products
ON CONFLICT (product_id) DO UPDATE
SET 
    upvotes = EXCLUDED.upvotes,
    downvotes = EXCLUDED.downvotes; 