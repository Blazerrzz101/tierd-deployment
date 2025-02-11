-- Update Logitech G Pro X Superlight
UPDATE public.products
SET 
    image_url = 'https://resource.logitechg.com/w_1000,c_limit,q_auto,f_auto,dpr_auto/d_transparent.gif/content/dam/gaming/en/products/pro-x-superlight/pro-x-superlight-black-gallery-1.png',
    description = 'The PRO X SUPERLIGHT is our lightest and fastest PRO mouse ever. Meticulously designed in collaboration with esports pros for the perfect shape, weight and feel. Powered by LIGHTSPEED, refined to reduce weight to less than 63 grams, and featuring a more responsive HERO 25K sensor, PRO X SUPERLIGHT is built to remove all obstacles between you and victory.',
    details = jsonb_build_object(
        'sensor', 'HERO 25K',
        'dpi_range', '100-25,600 DPI',
        'acceleration', '> 40G',
        'polling_rate', '1000Hz (1ms)',
        'buttons', '5 Programmable Buttons',
        'weight', '63g',
        'battery_life', 'Up to 70 hours',
        'connectivity', 'LIGHTSPEED Wireless / USB-C',
        'switch_type', 'Optical Mechanical',
        'images', jsonb_build_array(
            'https://resource.logitechg.com/w_1000,c_limit,q_auto,f_auto,dpr_auto/d_transparent.gif/content/dam/gaming/en/products/pro-x-superlight/pro-x-superlight-black-gallery-1.png',
            'https://resource.logitechg.com/w_1000,c_limit,q_auto,f_auto,dpr_auto/d_transparent.gif/content/dam/gaming/en/products/pro-x-superlight/pro-x-superlight-black-gallery-2.png',
            'https://resource.logitechg.com/w_1000,c_limit,q_auto,f_auto,dpr_auto/d_transparent.gif/content/dam/gaming/en/products/pro-x-superlight/pro-x-superlight-black-gallery-3.png',
            'https://resource.logitechg.com/w_1000,c_limit,q_auto,f_auto,dpr_auto/d_transparent.gif/content/dam/gaming/en/products/pro-x-superlight/pro-x-superlight-black-gallery-4.png'
        )
    )
WHERE name = 'Logitech G Pro X Superlight';

-- Update Razer Viper Ultimate
UPDATE public.products
SET 
    image_url = 'https://assets3.razerzone.com/GEh1-sgOk8-E_W8O2Rs6ZuSXEVQ=/1500x1000/https%3A%2F%2Fhybrismediaprod.blob.core.windows.net%2Fsys-master-phoenix-images-container%2Fh78%2Fh76%2F9081444655134%2Fviper-ultimate-black-1.png',
    description = 'The Razer Viper Ultimate features our most advanced optical sensor yet—the Focus+ 20K DPI Optical Sensor. Engineered with greater smart functionality, the sensor has 99.6% resolution accuracy and intelligent functions. This wireless gaming mouse is also equipped with our new Razer™ Optical Mouse Switches, featuring fast actuation and unrivaled durability.',
    details = jsonb_build_object(
        'sensor', 'Focus+ 20K Optical Sensor',
        'dpi_range', '100-20,000 DPI',
        'acceleration', '50G',
        'polling_rate', '1000Hz (1ms)',
        'buttons', '8 Programmable Buttons',
        'weight', '74g',
        'battery_life', 'Up to 70 hours',
        'connectivity', 'Razer HyperSpeed Wireless / USB-C',
        'switch_type', 'Optical Mouse Switches',
        'images', jsonb_build_array(
            'https://assets3.razerzone.com/GEh1-sgOk8-E_W8O2Rs6ZuSXEVQ=/1500x1000/https%3A%2F%2Fhybrismediaprod.blob.core.windows.net%2Fsys-master-phoenix-images-container%2Fh78%2Fh76%2F9081444655134%2Fviper-ultimate-black-1.png',
            'https://assets3.razerzone.com/xgQdk0u2VJqbfvF1ZaWO-ZpQG0U=/1500x1000/https%3A%2F%2Fhybrismediaprod.blob.core.windows.net%2Fsys-master-phoenix-images-container%2Fh79%2Fh76%2F9081444622366%2Fviper-ultimate-black-2.png',
            'https://assets3.razerzone.com/YZgEtBKVQvTr_wXC9FOEfGwFGBE=/1500x1000/https%3A%2F%2Fhybrismediaprod.blob.core.windows.net%2Fsys-master-phoenix-images-container%2Fh7a%2Fh76%2F9081444589598%2Fviper-ultimate-black-3.png'
        )
    )
WHERE name = 'Razer Viper Ultimate';

-- Update Zowie EC2
UPDATE public.products
SET 
    image_url = 'https://zowie.benq.com/content/dam/game/en/product/mouse/ec2/gallery-ec2-black-01.png',
    description = 'The EC2 is an ergonomic mouse developed for competitive gaming. The shape was designed to provide comfort and stability during long gaming sessions. With a medium size and right-handed ergonomic design, the EC2 is suitable for palm and claw grip styles.',
    details = jsonb_build_object(
        'sensor', '3360 Optical Sensor',
        'dpi_range', '400/800/1600/3200 DPI',
        'polling_rate', '1000Hz (1ms)',
        'buttons', '5 Buttons',
        'weight', '90g',
        'connectivity', 'USB / Plug & Play',
        'switch_type', 'Huano Switches',
        'cable', '2m / USB',
        'images', jsonb_build_array(
            'https://zowie.benq.com/content/dam/game/en/product/mouse/ec2/gallery-ec2-black-01.png',
            'https://zowie.benq.com/content/dam/game/en/product/mouse/ec2/gallery-ec2-black-02.png',
            'https://zowie.benq.com/content/dam/game/en/product/mouse/ec2/gallery-ec2-black-03.png',
            'https://zowie.benq.com/content/dam/game/en/product/mouse/ec2/gallery-ec2-black-04.png'
        )
    )
WHERE name = 'Zowie EC2';

-- Update Pulsar X2
UPDATE public.products
SET 
    image_url = 'https://cdn.shopify.com/s/files/1/0607/4917/7277/files/X2-W-M-1.png',
    description = 'The Pulsar X2 is a lightweight symmetrical gaming mouse designed for competitive gaming. With its ultra-lightweight design and high-performance sensor, the X2 delivers exceptional precision and speed for competitive gameplay.',
    details = jsonb_build_object(
        'sensor', 'PAW3395 Optical Sensor',
        'dpi_range', '50-26,000 DPI',
        'polling_rate', '1000Hz (1ms)',
        'buttons', '6 Buttons',
        'weight', '52g',
        'connectivity', 'USB-C',
        'switch_type', 'Kailh GM 8.0',
        'cable', 'Pulsar Phantomcord',
        'images', jsonb_build_array(
            'https://cdn.shopify.com/s/files/1/0607/4917/7277/files/X2-W-M-1.png',
            'https://cdn.shopify.com/s/files/1/0607/4917/7277/files/X2-W-M-2.png',
            'https://cdn.shopify.com/s/files/1/0607/4917/7277/files/X2-W-M-3.png',
            'https://cdn.shopify.com/s/files/1/0607/4917/7277/files/X2-W-M-4.png'
        )
    )
WHERE name = 'Pulsar X2';

-- Update Endgame Gear XM1r
UPDATE public.products
SET 
    image_url = 'https://cdn.shopify.com/s/files/1/0549/2681/products/xm1r_dark_reflex_1.png',
    description = 'The Endgame Gear XM1r is a professional gaming mouse featuring an innovative pre-sorted mechanical switch technology for consistent, crisp clicks. With its lightweight design and high-end sensor, the XM1r delivers exceptional performance for competitive gaming.',
    details = jsonb_build_object(
        'sensor', 'PAW3370 Optical Sensor',
        'dpi_range', '50-19,000 DPI',
        'polling_rate', '1000Hz (1ms)',
        'buttons', '5 Buttons',
        'weight', '70g',
        'connectivity', 'USB / Plug & Play',
        'switch_type', 'Kailh GM 8.0',
        'cable', 'Flexible Rubber Cable',
        'images', jsonb_build_array(
            'https://cdn.shopify.com/s/files/1/0549/2681/products/xm1r_dark_reflex_1.png',
            'https://cdn.shopify.com/s/files/1/0549/2681/products/xm1r_dark_reflex_2.png',
            'https://cdn.shopify.com/s/files/1/0549/2681/products/xm1r_dark_reflex_3.png',
            'https://cdn.shopify.com/s/files/1/0549/2681/products/xm1r_dark_reflex_4.png'
        )
    )
WHERE name = 'Endgame Gear XM1r';

-- Verify the updates
SELECT 
    name,
    url_slug,
    LEFT(description, 50) as description_preview,
    jsonb_object_keys(details) as detail_keys,
    jsonb_array_length(details->'images') as image_count
FROM public.products
WHERE category = 'gaming-mice'
ORDER BY name; 