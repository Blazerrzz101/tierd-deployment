-- Populate Products with Specifications

-- First, ensure we have the necessary columns
DO $$
BEGIN
    -- Add specifications column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'specifications'
    ) THEN
        ALTER TABLE products ADD COLUMN specifications JSONB;
    END IF;
END $$;

-- Update Gaming Mice
UPDATE products
SET specifications = jsonb_build_object(
    'sensor', CASE 
        WHEN name ILIKE '%hero%' THEN 'HERO 25K'
        WHEN name ILIKE '%focus pro%' THEN 'Focus Pro 30K'
        WHEN name ILIKE '%focus%' THEN 'Focus+ 20K'
        ELSE 'Optical'
    END,
    'dpi', CASE 
        WHEN name ILIKE '%hero%' THEN 25600
        WHEN name ILIKE '%focus pro%' THEN 30000
        WHEN name ILIKE '%focus%' THEN 20000
        ELSE 16000
    END,
    'weight_grams', CASE 
        WHEN name ILIKE '%superlight%' THEN 63
        WHEN name ILIKE '%ultra%' THEN 69
        WHEN name ILIKE '%wireless%' THEN 85
        ELSE 75
    END,
    'connection_type', CASE 
        WHEN name ILIKE '%wireless%' OR name ILIKE '%lightspeed%' THEN 'Wireless'
        ELSE 'Wired'
    END,
    'rgb_lighting', name ILIKE '%rgb%' OR name ILIKE '%chroma%',
    'buttons', CASE 
        WHEN name ILIKE '%mmo%' THEN 12
        WHEN name ILIKE '%pro%' THEN 8
        ELSE 6
    END,
    'battery_life_hours', CASE 
        WHEN name ILIKE '%wireless%' OR name ILIKE '%lightspeed%' THEN 
            CASE 
                WHEN name ILIKE '%pro%' THEN 70
                ELSE 60
            END
        ELSE NULL
    END,
    'polling_rate_hz', 1000,
    'ergonomic_design', name ILIKE '%ergo%' OR name ILIKE '%comfort%'
)
WHERE category = 'gaming-mice';

-- Update Gaming Keyboards
UPDATE products
SET specifications = jsonb_build_object(
    'switch_type', CASE 
        WHEN name ILIKE '%red%' THEN 'Cherry MX Red'
        WHEN name ILIKE '%blue%' THEN 'Cherry MX Blue'
        WHEN name ILIKE '%brown%' THEN 'Cherry MX Brown'
        WHEN name ILIKE '%optical%' THEN 'Optical'
        ELSE 'Mechanical'
    END,
    'form_factor', CASE 
        WHEN name ILIKE '%tkl%' OR name ILIKE '%tenkeyless%' THEN 'TKL'
        WHEN name ILIKE '%60%' THEN '60%'
        WHEN name ILIKE '%75%' THEN '75%'
        ELSE 'Full Size'
    END,
    'backlighting', CASE 
        WHEN name ILIKE '%rgb%' THEN 'RGB'
        WHEN name ILIKE '%led%' THEN 'Single Color'
        ELSE 'None'
    END,
    'connection_type', CASE 
        WHEN name ILIKE '%wireless%' THEN 'Wireless'
        ELSE 'Wired'
    END,
    'multimedia_keys', name ILIKE '%media%' OR name ILIKE '%control%',
    'usb_passthrough', name ILIKE '%usb%' OR name ILIKE '%passthrough%',
    'wrist_rest', name ILIKE '%wrist%' OR name ILIKE '%rest%',
    'anti_ghosting', true,
    'nkro', true,
    'water_resistant', name ILIKE '%water%' OR name ILIKE '%spill%'
)
WHERE category = 'gaming-keyboards';

-- Update Gaming Headsets
UPDATE products
SET specifications = jsonb_build_object(
    'driver_size_mm', CASE 
        WHEN name ILIKE '%pro%' THEN 50
        ELSE 40
    END,
    'frequency_response', '[20-20000 Hz]',
    'surround_sound', CASE 
        WHEN name ILIKE '%7.1%' OR name ILIKE '%surround%' THEN '7.1 Virtual Surround'
        ELSE 'Stereo'
    END,
    'microphone_type', CASE 
        WHEN name ILIKE '%noise%' THEN 'Noise-cancelling'
        ELSE 'Standard'
    END,
    'connection_type', CASE 
        WHEN name ILIKE '%wireless%' THEN 'Wireless'
        WHEN name ILIKE '%usb%' THEN 'USB'
        ELSE '3.5mm'
    END,
    'rgb_lighting', name ILIKE '%rgb%' OR name ILIKE '%chroma%',
    'ear_cushion_material', CASE 
        WHEN name ILIKE '%leather%' THEN 'Leather'
        WHEN name ILIKE '%fabric%' THEN 'Fabric'
        ELSE 'Memory Foam'
    END,
    'detachable_mic', name ILIKE '%detach%' OR name ILIKE '%remov%',
    'battery_life_hours', CASE 
        WHEN name ILIKE '%wireless%' THEN 
            CASE 
                WHEN name ILIKE '%pro%' THEN 24
                ELSE 20
            END
        ELSE NULL
    END,
    'weight_grams', CASE 
        WHEN name ILIKE '%light%' THEN 280
        ELSE 320
    END
)
WHERE category = 'gaming-headsets';

-- Update Gaming Monitors
UPDATE products
SET specifications = jsonb_build_object(
    'screen_size_inches', CASE 
        WHEN name ILIKE '%27%' THEN 27
        WHEN name ILIKE '%32%' THEN 32
        WHEN name ILIKE '%24%' THEN 24
        ELSE 27
    END,
    'resolution', CASE 
        WHEN name ILIKE '%4k%' THEN '3840x2160'
        WHEN name ILIKE '%2k%' OR name ILIKE '%1440p%' THEN '2560x1440'
        ELSE '1920x1080'
    END,
    'refresh_rate_hz', CASE 
        WHEN name ILIKE '%360%' THEN 360
        WHEN name ILIKE '%240%' THEN 240
        WHEN name ILIKE '%165%' THEN 165
        WHEN name ILIKE '%144%' THEN 144
        ELSE 60
    END,
    'panel_type', CASE 
        WHEN name ILIKE '%ips%' THEN 'IPS'
        WHEN name ILIKE '%va%' THEN 'VA'
        WHEN name ILIKE '%tn%' THEN 'TN'
        ELSE 'IPS'
    END,
    'response_time_ms', CASE 
        WHEN name ILIKE '%1ms%' THEN 1
        WHEN name ILIKE '%4ms%' THEN 4
        ELSE 1
    END,
    'adaptive_sync', CASE 
        WHEN name ILIKE '%gsync%' THEN 'G-SYNC'
        WHEN name ILIKE '%freesync%' THEN 'FreeSync'
        ELSE 'Adaptive Sync'
    END,
    'hdr', name ILIKE '%hdr%',
    'curved', name ILIKE '%curved%',
    'speakers', name ILIKE '%speaker%',
    'vesa_mount', true
)
WHERE category = 'gaming-monitors';

-- Update Gaming Chairs
UPDATE products
SET specifications = jsonb_build_object(
    'max_weight_kg', CASE 
        WHEN name ILIKE '%xl%' OR name ILIKE '%max%' THEN 180
        ELSE 150
    END,
    'material', CASE 
        WHEN name ILIKE '%leather%' THEN 'PU Leather'
        WHEN name ILIKE '%fabric%' THEN 'Fabric'
        WHEN name ILIKE '%mesh%' THEN 'Mesh'
        ELSE 'PU Leather'
    END,
    'recline_degrees', CASE 
        WHEN name ILIKE '%180%' THEN 180
        WHEN name ILIKE '%165%' THEN 165
        ELSE 135
    END,
    'armrest', CASE 
        WHEN name ILIKE '%4d%' THEN '4D'
        WHEN name ILIKE '%3d%' THEN '3D'
        ELSE '2D'
    END,
    'lumbar_support', name NOT ILIKE '%basic%',
    'head_pillow', name NOT ILIKE '%basic%',
    'wheel_size_mm', 65,
    'height_adjustable', true,
    'swivel', true,
    'assembly_required', true
)
WHERE category = 'gaming-chairs';

-- Update Microphones
UPDATE products
SET specifications = jsonb_build_object(
    'type', CASE 
        WHEN name ILIKE '%condenser%' THEN 'Condenser'
        WHEN name ILIKE '%dynamic%' THEN 'Dynamic'
        ELSE 'USB Condenser'
    END,
    'pattern', CASE 
        WHEN name ILIKE '%omni%' THEN 'Omnidirectional'
        WHEN name ILIKE '%bi%' THEN 'Bidirectional'
        ELSE 'Cardioid'
    END,
    'frequency_response', '[20-20000 Hz]',
    'sample_rate', '48kHz/16-bit',
    'connection', CASE 
        WHEN name ILIKE '%xlr%' THEN 'XLR'
        ELSE 'USB'
    END,
    'zero_latency_monitoring', name ILIKE '%monitor%',
    'mute_button', true,
    'gain_control', true,
    'rgb_lighting', name ILIKE '%rgb%',
    'shock_mount', name ILIKE '%shock%' OR name ILIKE '%pro%'
)
WHERE category = 'microphones';

-- Update Webcams
UPDATE products
SET specifications = jsonb_build_object(
    'resolution', CASE 
        WHEN name ILIKE '%4k%' THEN '4K UHD'
        WHEN name ILIKE '%1080p%' OR name ILIKE '%hd%' THEN '1080p'
        ELSE '720p'
    END,
    'fps', CASE 
        WHEN name ILIKE '%60%' THEN 60
        ELSE 30
    END,
    'fov_degrees', CASE 
        WHEN name ILIKE '%wide%' THEN 90
        ELSE 78
    END,
    'autofocus', name NOT ILIKE '%manual%',
    'microphone', name NOT ILIKE '%no mic%',
    'privacy_cover', name ILIKE '%privacy%' OR name ILIKE '%cover%',
    'low_light', name ILIKE '%low light%' OR name ILIKE '%night%',
    'mounting_options', CASE 
        WHEN name ILIKE '%clip%' THEN 'Monitor Clip'
        WHEN name ILIKE '%stand%' THEN 'Desk Stand'
        ELSE 'Monitor Clip and Tripod'
    END,
    'hdr', name ILIKE '%hdr%',
    'connection', 'USB'
)
WHERE category = 'webcams';

-- Verify the updates
DO $$
DECLARE
    category_count RECORD;
BEGIN
    RAISE NOTICE 'Product Specification Update Summary:';
    FOR category_count IN
        SELECT 
            category,
            COUNT(*) as total,
            COUNT(specifications) as with_specs
        FROM products
        GROUP BY category
    LOOP
        RAISE NOTICE '% - Total: %, With Specifications: %', 
            category_count.category, 
            category_count.total, 
            category_count.with_specs;
    END LOOP;
END $$; 