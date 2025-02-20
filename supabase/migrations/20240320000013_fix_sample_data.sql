-- Delete existing sample data
DELETE FROM products;

-- Insert sample data with correct category format
INSERT INTO products (name, description, category, price, image_url, url_slug, specifications, is_active) VALUES
-- Gaming Mice
('Logitech G Pro X Superlight', 'Ultra-lightweight gaming mouse', 'gaming-mice', 149.99, 'https://example.com/gpro.jpg', 'logitech-g-pro-x-superlight', '{"dpi": "25600", "weight": "63g", "connection": "wireless"}', true),
('Razer DeathAdder V3 Pro', 'Ergonomic gaming mouse', 'gaming-mice', 159.99, 'https://example.com/da.jpg', 'razer-deathadder-v3-pro', '{"dpi": "30000", "weight": "64g", "connection": "wireless"}', true),
('Zowie EC2-C', 'Professional gaming mouse', 'gaming-mice', 69.99, 'https://example.com/ec2.jpg', 'zowie-ec2-c', '{"dpi": "3200", "weight": "73g", "connection": "wired"}', true),

-- Gaming Keyboards
('Wooting 60 HE', 'Analog optical keyboard', 'gaming-keyboards', 199.99, 'https://example.com/wooting.jpg', 'wooting-60-he', '{"switches": "Lekker", "size": "60%", "features": "analog"}', true),
('Keychron Q1', 'Custom mechanical keyboard', 'gaming-keyboards', 179.99, 'https://example.com/q1.jpg', 'keychron-q1', '{"switches": "Gateron", "size": "75%", "features": "hot-swap"}', true),
('Ducky One 3', 'Premium gaming keyboard', 'gaming-keyboards', 129.99, 'https://example.com/ducky.jpg', 'ducky-one-3', '{"switches": "Cherry MX", "size": "TKL", "features": "RGB"}', true),

-- Gaming Headsets
('Sennheiser HD 560S', 'Audiophile gaming headset', 'gaming-headsets', 199.99, 'https://example.com/hd560s.jpg', 'sennheiser-hd-560s', '{"driver": "38mm", "impedance": "120ohm", "type": "open-back"}', true),
('HyperX Cloud Alpha', 'Premium gaming headset', 'gaming-headsets', 99.99, 'https://example.com/alpha.jpg', 'hyperx-cloud-alpha', '{"driver": "50mm", "connection": "wired", "features": "detachable-mic"}', true),
('Beyerdynamic DT 900 Pro X', 'Studio gaming headset', 'gaming-headsets', 299.99, 'https://example.com/dt900.jpg', 'beyerdynamic-dt-900-pro-x', '{"driver": "45mm", "impedance": "48ohm", "type": "open-back"}', true),

-- Gaming Monitors
('LG 27GP950-B', '4K 144Hz gaming monitor', 'gaming-monitors', 799.99, 'https://example.com/lg.jpg', 'lg-27gp950-b', '{"resolution": "4K", "refresh": "144Hz", "panel": "Nano IPS"}', true),
('Samsung Odyssey G7', 'Curved gaming monitor', 'gaming-monitors', 699.99, 'https://example.com/g7.jpg', 'samsung-odyssey-g7', '{"resolution": "1440p", "refresh": "240Hz", "panel": "VA"}', true),
('ASUS ROG Swift PG279QM', 'Esports gaming monitor', 'gaming-monitors', 849.99, 'https://example.com/pg279qm.jpg', 'asus-rog-swift-pg279qm', '{"resolution": "1440p", "refresh": "240Hz", "panel": "IPS"}', true);

-- Refresh materialized views
REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings;
REFRESH MATERIALIZED VIEW CONCURRENTLY category_stats; 