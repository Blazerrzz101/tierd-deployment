-- Clear existing data
TRUNCATE products, users CASCADE;

-- Create sample user
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@example.com',
  '{"username": "demo_user", "avatar_url": null}'
);

-- Insert sample data with correct category format
INSERT INTO products (name, description, category, price, image_url, url_slug, specifications, is_active) VALUES
-- Gaming Mice
('Logitech G Pro X Superlight', 'Ultra-lightweight gaming mouse', 'gaming-mice', 149.99, '/images/products/placeholder-mouse.svg', 'logitech-g-pro-x-superlight', '{"dpi": "25600", "weight": "63g", "connection": "wireless", "sensor": "HERO 25K"}', true),
('Razer DeathAdder V3 Pro', 'Ergonomic gaming mouse', 'gaming-mice', 159.99, '/images/products/placeholder-mouse.svg', 'razer-deathadder-v3-pro', '{"dpi": "30000", "weight": "64g", "connection": "wireless", "sensor": "Focus Pro 30K"}', true),
('Zowie EC2-C', 'Professional gaming mouse', 'gaming-mice', 69.99, '/images/products/placeholder-mouse.svg', 'zowie-ec2-c', '{"dpi": "3200", "weight": "73g", "connection": "wired", "sensor": "3360"}', true),
('Pulsar X2', 'Ultra-lightweight symmetrical gaming mouse', 'gaming-mice', 89.99, '/images/products/placeholder-mouse.svg', 'pulsar-x2', '{"dpi": "26000", "weight": "52g", "connection": "wireless", "battery_life": "70h"}', true),

-- Gaming Keyboards
('Wooting 60 HE', 'Analog optical keyboard', 'gaming-keyboards', 199.99, '/images/products/placeholder-keyboard.svg', 'wooting-60-he', '{"switches": "Lekker", "size": "60%", "features": "analog"}', true),
('Keychron Q1', 'Custom mechanical keyboard', 'gaming-keyboards', 179.99, '/images/products/placeholder-keyboard.svg', 'keychron-q1', '{"switches": "Gateron", "size": "75%", "features": "hot-swap"}', true),
('Ducky One 3', 'Premium gaming keyboard', 'gaming-keyboards', 129.99, '/images/products/placeholder-keyboard.svg', 'ducky-one-3', '{"switches": "Cherry MX", "size": "TKL", "features": "RGB"}', true),
('Zoom75', 'Premium gasket-mounted mechanical keyboard', 'gaming-keyboards', 329.99, '/images/products/placeholder-keyboard.svg', 'zoom75', '{"switches": "Gateron Black Ink", "size": "75%", "features": ["hot-swap", "rotary-knob", "aluminum-case"]}', true),

-- Gaming Headsets
('Sennheiser HD 560S', 'Audiophile gaming headset', 'gaming-headsets', 199.99, '/images/products/placeholder-headset.svg', 'sennheiser-hd-560s', '{"driver": "38mm", "impedance": "120ohm", "type": "open-back"}', true),
('HyperX Cloud Alpha', 'Premium gaming headset', 'gaming-headsets', 99.99, '/images/products/placeholder-headset.svg', 'hyperx-cloud-alpha', '{"driver": "50mm", "connection": "wired", "features": "detachable-mic"}', true),
('Beyerdynamic DT 900 Pro X', 
'Professional studio-grade gaming headset with exceptional sound quality and comfort. Features newly developed STELLAR.45 driver system, delivering precise and natural sound reproduction ideal for both gaming and content creation. The open-back design provides a wide, natural soundstage perfect for positional audio in games.', 
'gaming-headsets', 
299.99, 
'https://north-america.beyerdynamic.com/media/catalog/product/cache/6c90e81efe6f340e875166b6a08075d1/d/t/dt_900_pro_x_front.jpg', 
'beyerdynamic-dt-900-pro-x', 
'{
    "type": "Open-back",
    "driver": "STELLAR.45 driver system",
    "impedance": "48 ohm",
    "frequency_response": "5 - 40,000 Hz",
    "sound_pressure_level": "100 dB SPL",
    "weight": "345g",
    "cable": "Detachable mini-XLR",
    "features": [
        "Replaceable velour ear pads",
        "Meta fabric headband",
        "Lockable mini-XLR connection",
        "Made in Germany",
        "Professional build quality",
        "Wide soundstage",
        "Natural sound reproduction",
        "Excellent comfort for long sessions"
    ],
    "connection": "Wired (mini-XLR)",
    "microphone": "None (studio headphones)"
}'::jsonb,
true),

-- Gaming Monitors
('LG 27GP950-B', '4K 144Hz gaming monitor', 'gaming-monitors', 799.99, '/images/products/placeholder-monitor.svg', 'lg-27gp950-b', '{"resolution": "4K", "refresh": "144Hz", "panel": "Nano IPS"}', true),
('Samsung Odyssey G7', 'Curved gaming monitor', 'gaming-monitors', 699.99, '/images/products/placeholder-monitor.svg', 'samsung-odyssey-g7', '{"resolution": "1440p", "refresh": "240Hz", "panel": "VA"}', true),
('ASUS ROG Swift PG279QM', 'Esports gaming monitor', 'gaming-monitors', 849.99, '/images/products/placeholder-monitor.svg', 'asus-rog-swift-pg279qm', '{"resolution": "1440p", "refresh": "240Hz", "panel": "IPS"}', true),
('MSI MEG ARTYMIS 341', 'QD-OLED ultrawide gaming monitor', 'gaming-monitors', 1199.99, '/images/products/placeholder-monitor.svg', 'msi-meg-artymis-341', '{"resolution": "3440x1440", "refresh": "175Hz", "panel": "QD-OLED", "hdr": "True HDR 1000"}', true);

-- Insert sample votes and reviews for each product
INSERT INTO votes (product_id, user_id, vote_type)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'up'
FROM products p;

INSERT INTO reviews (product_id, user_id, rating, title, content)
SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000001'::uuid,
    4.5,
    'Excellent Product - Highly Recommended',
    'Great product, highly recommended! The build quality is excellent and performance exceeds expectations. Would definitely buy again.'
FROM products p;

-- Refresh materialized views
REFRESH MATERIALIZED VIEW product_rankings; 