-- Clear existing data
TRUNCATE products CASCADE;

-- Gaming Mice
INSERT INTO products (name, description, category, url_slug, price, specifications, image_url)
VALUES 
  (
    'Logitech G Pro X Superlight',
    'Ultra-lightweight wireless gaming mouse designed for esports professionals. Features HERO 25K sensor and weighs only 63g.',
    'Gaming Mice',
    'logitech-g-pro-x-superlight',
    149.99,
    '{
      "sensor": "HERO 25K",
      "dpi": 25600,
      "weight": "63g",
      "battery_life": "70 hours",
      "connection": "Wireless",
      "rgb": false,
      "polling_rate": "1000Hz",
      "buttons": 5
    }'::jsonb,
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=60'
  ),
  (
    'Razer DeathAdder V3 Pro',
    'Professional-grade gaming mouse with Focus Pro 30K optical sensor and ergonomic design.',
    'Gaming Mice',
    'razer-deathadder-v3-pro',
    159.99,
    '{
      "sensor": "Focus Pro 30K",
      "dpi": 30000,
      "weight": "64g",
      "battery_life": "90 hours",
      "connection": "Wireless",
      "rgb": false,
      "polling_rate": "1000Hz",
      "buttons": 5
    }'::jsonb,
    'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&auto=format&fit=crop&q=60'
  ),
  (
    'Zowie EC2-C',
    'Professional esports mouse with 3360 sensor and ergonomic right-handed design.',
    'Gaming Mice',
    'zowie-ec2-c',
    69.99,
    '{
      "sensor": "3360",
      "dpi": 3200,
      "weight": "73g",
      "connection": "Wired",
      "rgb": false,
      "polling_rate": "1000Hz",
      "buttons": 5
    }'::jsonb,
    'https://images.unsplash.com/photo-1623820919239-0d0ff10797a1?w=800&auto=format&fit=crop&q=60'
  );

-- Gaming Keyboards
INSERT INTO products (name, description, category, url_slug, price, specifications, image_url)
VALUES 
  (
    'Wooting 60HE',
    'Revolutionary analog mechanical keyboard with Lekker switches and adjustable actuation points.',
    'Gaming Keyboards',
    'wooting-60he',
    199.99,
    '{
      "switches": "Lekker (Hall Effect)",
      "form_factor": "60%",
      "backlight": "RGB",
      "hot_swappable": true,
      "connection": "USB-C",
      "analog_input": true,
      "rapid_trigger": true
    }'::jsonb,
    'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=60'
  ),
  (
    'Keychron Q1 Pro',
    'Premium wireless mechanical keyboard with QMK/VIA support and gasket mount design.',
    'Gaming Keyboards',
    'keychron-q1-pro',
    199.99,
    '{
      "switches": "Gateron G Pro",
      "form_factor": "75%",
      "backlight": "RGB",
      "hot_swappable": true,
      "connection": "Wireless/USB-C",
      "case_material": "Aluminum",
      "plate_material": "Steel"
    }'::jsonb,
    'https://images.unsplash.com/photo-1595044426077-d36d9236d54a?w=800&auto=format&fit=crop&q=60'
  ),
  (
    'Razer Huntsman V2',
    'Optical gaming keyboard with advanced features and premium build quality.',
    'Gaming Keyboards',
    'razer-huntsman-v2',
    249.99,
    '{
      "switches": "Razer Optical",
      "form_factor": "Full size",
      "backlight": "RGB",
      "wrist_rest": true,
      "connection": "USB-C",
      "polling_rate": "8000Hz",
      "anti_ghosting": true
    }'::jsonb,
    'https://images.unsplash.com/photo-1595044426111-2f255729d051?w=800&auto=format&fit=crop&q=60'
  );

-- Gaming Monitors
INSERT INTO products (name, description, category, url_slug, price, specifications, image_url)
VALUES 
  (
    'ASUS ROG Swift 360Hz PG259QN',
    'Ultra-fast 360Hz gaming monitor designed for competitive esports.',
    'Gaming Monitors',
    'asus-rog-swift-pg259qn',
    699.99,
    '{
      "panel": "IPS",
      "resolution": "1920x1080",
      "refresh_rate": "360Hz",
      "response_time": "1ms",
      "hdr": "HDR10",
      "g_sync": true,
      "size": "24.5 inch"
    }'::jsonb,
    'https://images.unsplash.com/photo-1616711906333-23e63cd0884c?w=800&auto=format&fit=crop&q=60'
  ),
  (
    'Samsung Odyssey G7',
    'Curved 1440p gaming monitor with 240Hz refresh rate and QLED technology.',
    'Gaming Monitors',
    'samsung-odyssey-g7',
    799.99,
    '{
      "panel": "VA QLED",
      "resolution": "2560x1440",
      "refresh_rate": "240Hz",
      "response_time": "1ms",
      "hdr": "HDR600",
      "g_sync": true,
      "size": "27 inch",
      "curvature": "1000R"
    }'::jsonb,
    'https://images.unsplash.com/photo-1616711907003-046ba89d4c58?w=800&auto=format&fit=crop&q=60'
  ),
  (
    'LG 27GP950-B',
    '4K gaming monitor with HDMI 2.1 and 144Hz refresh rate.',
    'Gaming Monitors',
    'lg-27gp950-b',
    899.99,
    '{
      "panel": "Nano IPS",
      "resolution": "3840x2160",
      "refresh_rate": "144Hz",
      "response_time": "1ms",
      "hdr": "HDR600",
      "g_sync": true,
      "size": "27 inch",
      "hdmi": "2.1"
    }'::jsonb,
    'https://images.unsplash.com/photo-1616711907914-c0c5e6c13701?w=800&auto=format&fit=crop&q=60'
  );

-- Gaming Headsets
INSERT INTO products (name, description, category, url_slug, price, specifications, image_url)
VALUES 
  (
    'Sennheiser HD 800S',
    'Audiophile-grade open-back headphones perfect for immersive gaming.',
    'Gaming Headsets',
    'sennheiser-hd-800s',
    1599.99,
    '{
      "type": "Open-back",
      "driver": "50mm Ring Radiator",
      "frequency_response": "4-51000Hz",
      "impedance": "300 ohm",
      "weight": "330g",
      "connection": "6.3mm/XLR",
      "microphone": false
    }'::jsonb,
    'https://images.unsplash.com/photo-1618066135557-593e0bfd9d27?w=800&auto=format&fit=crop&q=60'
  ),
  (
    'Beyerdynamic DT 990 Pro',
    'Professional studio headphones with excellent gaming performance.',
    'Gaming Headsets',
    'beyerdynamic-dt-990-pro',
    159.99,
    '{
      "type": "Open-back",
      "driver": "45mm Dynamic",
      "frequency_response": "5-35000Hz",
      "impedance": "250 ohm",
      "weight": "250g",
      "connection": "3.5mm",
      "cable_length": "3m"
    }'::jsonb,
    'https://images.unsplash.com/photo-1599669454699-248893623440?w=800&auto=format&fit=crop&q=60'
  ),
  (
    'HyperX Cloud Alpha',
    'Premium gaming headset with dual chamber drivers.',
    'Gaming Headsets',
    'hyperx-cloud-alpha',
    99.99,
    '{
      "type": "Closed-back",
      "driver": "50mm Dual Chamber",
      "frequency_response": "13-27000Hz",
      "impedance": "65 ohm",
      "weight": "336g",
      "connection": "3.5mm",
      "microphone": true,
      "detachable_cable": true
    }'::jsonb,
    'https://images.unsplash.com/photo-1600086827875-a63b01f1335c?w=800&auto=format&fit=crop&q=60'
  );

-- Gaming Chairs
INSERT INTO products (name, description, category, url_slug, price, specifications, image_url)
VALUES 
  (
    'Herman Miller Embody Gaming',
    'Premium ergonomic gaming chair designed for long gaming sessions.',
    'Gaming Chairs',
    'herman-miller-embody-gaming',
    1695.00,
    '{
      "material": "Multi-layer fabric",
      "max_weight": "300lbs",
      "adjustable_arms": true,
      "lumbar_support": true,
      "recline": "Synchronized",
      "warranty": "12 years",
      "assembly_required": false
    }'::jsonb,
    'https://images.unsplash.com/photo-1610395219791-21b0353e43cb?w=800&auto=format&fit=crop&q=60'
  ),
  (
    'Steelcase Gesture',
    'High-end office chair perfect for gaming with advanced arm system.',
    'Gaming Chairs',
    'steelcase-gesture',
    1299.00,
    '{
      "material": "Fabric",
      "max_weight": "400lbs",
      "adjustable_arms": true,
      "lumbar_support": true,
      "recline": "Variable back stop",
      "warranty": "12 years",
      "arm_system": "360 degree"
    }'::jsonb,
    'https://images.unsplash.com/photo-1611883653111-0d295cc8c0c6?w=800&auto=format&fit=crop&q=60'
  ),
  (
    'Secretlab Titan Evo 2022',
    'Premium gaming chair with advanced ergonomic features.',
    'Gaming Chairs',
    'secretlab-titan-evo-2022',
    549.00,
    '{
      "material": "NEO Hybrid Leatherette",
      "max_weight": "395lbs",
      "adjustable_arms": "4D",
      "lumbar_support": "Integrated",
      "recline": "165 degrees",
      "warranty": "5 years",
      "size": "Regular"
    }'::jsonb,
    'https://images.unsplash.com/photo-1601855018889-08c25e5a2861?w=800&auto=format&fit=crop&q=60'
  );

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW product_rankings; 