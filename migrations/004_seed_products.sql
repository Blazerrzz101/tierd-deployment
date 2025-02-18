-- Seed initial gaming mice products
INSERT INTO public.products (name, description, category, price, image_url, url_slug, specifications) VALUES
(
    'Logitech G Pro X Superlight',
    'Ultra-lightweight wireless gaming mouse designed for esports professionals.',
    'Gaming Mouse',
    149.99,
    'https://resource.logitechg.com/w_692,c_limit,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/gaming/en/products/pro-x-superlight/pro-x-superlight-black-gallery-1.png',
    'logitech-g-pro-x-superlight',
    '{
        "sensor": "HERO 25K",
        "dpi": 25600,
        "weight": "63g",
        "battery_life": "70 hours",
        "connection": "Wireless",
        "rgb": false,
        "buttons": 5
    }'::jsonb
),
(
    'Razer Viper Ultimate',
    'Wireless gaming mouse with advanced optical sensor and ambidextrous design.',
    'Gaming Mouse',
    129.99,
    'https://assets3.razerzone.com/SR5mxzLJQqkdYBDo7yZkGPGPCY0=/1500x1000/https%3A%2F%2Fhybrismediaprod.blob.core.windows.net%2Fsys-master-phoenix-images-container%2Fh51%2Fh92%2F9081449799710%2Fviper-ultimate-500x500.png',
    'razer-viper-ultimate',
    '{
        "sensor": "Focus+ Optical",
        "dpi": 20000,
        "weight": "74g",
        "battery_life": "70 hours",
        "connection": "Wireless",
        "rgb": true,
        "buttons": 8
    }'::jsonb
),
(
    'Zowie EC2-C',
    'Professional gaming mouse with ergonomic right-handed design and flawless sensor.',
    'Gaming Mouse',
    69.99,
    'https://zowie.benq.com/content/dam/game/en/product/mouse/ec2-c/gallery/03-ec2-c-right.png',
    'zowie-ec2-c',
    '{
        "sensor": "3360",
        "dpi": 3200,
        "weight": "73g",
        "connection": "Wired",
        "rgb": false,
        "buttons": 5
    }'::jsonb
),
(
    'Pulsar X2 Mini',
    'Ultra-lightweight symmetrical gaming mouse with top performance.',
    'Gaming Mouse',
    89.99,
    'https://cdn.shopify.com/s/files/1/0550/6266/9203/products/X2Mini_Red_1_1445x.jpg',
    'pulsar-x2-mini',
    '{
        "sensor": "PAW3395",
        "dpi": 26000,
        "weight": "52g",
        "connection": "Wired",
        "rgb": true,
        "buttons": 6
    }'::jsonb
),
(
    'Finalmouse Starlight-12 Poseidon',
    'Limited edition ultra-lightweight magnesium alloy gaming mouse.',
    'Gaming Mouse',
    189.99,
    'https://finalmouse.com/cdn/shop/products/starlight-12-poseidon-small.png',
    'finalmouse-starlight-12-poseidon',
    '{
        "sensor": "Finalsensor",
        "dpi": 20000,
        "weight": "42g",
        "connection": "Wireless",
        "rgb": false,
        "buttons": 6
    }'::jsonb
);

-- Refresh the rankings
SELECT refresh_rankings(); 