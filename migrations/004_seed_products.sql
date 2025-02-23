-- Drop existing enum type
DROP TYPE IF EXISTS product_category CASCADE;

-- Recreate enum type with kebab-case values
CREATE TYPE product_category AS ENUM (
    'gaming-mice',
    'gaming-keyboards',
    'gaming-monitors',
    'gaming-headsets',
    'gaming-chairs'
);

-- Add the column back
ALTER TABLE products ADD COLUMN category product_category;

-- Seed initial gaming mice products
INSERT INTO public.products (name, description, category, price, image_url, url_slug, specifications) VALUES
(
    'Logitech G Pro X Superlight',
    'Ultra-lightweight wireless gaming mouse designed for esports professionals.',
    'gaming-mice',
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
    'gaming-mice',
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
    'gaming-mice',
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
    'gaming-mice',
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
    'gaming-mice',
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

-- Add gaming keyboards
INSERT INTO public.products (name, description, category, price, image_url, url_slug, specifications) VALUES
(
    'Wooting 60 HE',
    'Revolutionary analog optical keyboard with rapid trigger technology.',
    'gaming-keyboards',
    199.99,
    'https://wooting.io/assets/images/wooting-60he.png',
    'wooting-60-he',
    '{
        "switches": "Lekker",
        "form_factor": "60%",
        "features": ["Analog input", "Rapid trigger", "Hot-swappable"],
        "connection": "USB-C",
        "rgb": true
    }'::jsonb
),
(
    'Ducky One 3',
    'Premium mechanical keyboard with hot-swappable switches and RGB lighting.',
    'gaming-keyboards',
    129.99,
    'https://www.duckychannel.com.tw/upload/2021_12_21/202112211635198697.png',
    'ducky-one-3',
    '{
        "switches": "Cherry MX",
        "form_factor": "TKL",
        "features": ["Hot-swappable", "PBT keycaps", "USB Type-C"],
        "connection": "USB-C",
        "rgb": true
    }'::jsonb
);

-- Add gaming headsets
INSERT INTO public.products (name, description, category, price, image_url, url_slug, specifications) VALUES
(
    'HyperX Cloud Alpha',
    'Premium gaming headset with dual chamber drivers.',
    'gaming-headsets',
    99.99,
    'https://media.kingston.com/hyperx/features/hx-features-headset-cloud-alpha.jpg',
    'hyperx-cloud-alpha',
    '{
        "drivers": "50mm Dual Chamber",
        "frequency_response": "13Hz-27kHz",
        "connection": "3.5mm",
        "microphone": "Detachable",
        "features": ["Memory foam ear cushions", "Aluminum frame"]
    }'::jsonb
),
(
    'SteelSeries Arctis Pro',
    'High-fidelity gaming headset with dedicated DAC.',
    'gaming-headsets',
    249.99,
    'https://media.steelseriescdn.com/thumbs/catalog/items/61453/f0d3f920e8a64c1b8e08f7c150600877.png',
    'steelseries-arctis-pro',
    '{
        "drivers": "40mm Neodymium",
        "frequency_response": "10Hz-40kHz",
        "connection": "USB and Optical",
        "microphone": "Retractable ClearCast",
        "features": ["Hi-Res Audio", "DTS Headphone:X v2.0"]
    }'::jsonb
);

-- Add gaming monitors
INSERT INTO public.products (name, description, category, price, image_url, url_slug, specifications) VALUES
(
    'LG 27GP950-B',
    '27-inch 4K gaming monitor with HDMI 2.1.',
    'gaming-monitors',
    899.99,
    'https://www.lg.com/us/images/monitors/md07000474/gallery/desktop-01.jpg',
    'lg-27gp950-b',
    '{
        "panel": "Nano IPS",
        "resolution": "3840x2160",
        "refresh_rate": "160Hz",
        "response_time": "1ms",
        "hdr": "DisplayHDR 600",
        "features": ["HDMI 2.1", "G-SYNC Compatible", "FreeSync Premium Pro"]
    }'::jsonb
),
(
    'ASUS ROG Swift PG279QM',
    '27-inch 1440p gaming monitor with 240Hz refresh rate.',
    'gaming-monitors',
    849.99,
    'https://dlcdnwebimgs.asus.com/gain/36E03AAF-3DB2-4A41-8F55-C4D194FEED63/',
    'asus-rog-swift-pg279qm',
    '{
        "panel": "IPS",
        "resolution": "2560x1440",
        "refresh_rate": "240Hz",
        "response_time": "1ms",
        "hdr": "DisplayHDR 400",
        "features": ["G-SYNC Ultimate", "ELMB-Sync", "Factory calibrated"]
    }'::jsonb
);

-- Refresh the rankings
SELECT refresh_product_rankings(); 