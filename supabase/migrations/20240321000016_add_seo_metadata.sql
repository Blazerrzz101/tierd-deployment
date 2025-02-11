-- Create SEO metadata table
CREATE TABLE IF NOT EXISTS seo_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_path TEXT UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    keywords TEXT[],
    og_title TEXT,
    og_description TEXT,
    og_image_url TEXT,
    canonical_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sitemap entries table
CREATE TABLE IF NOT EXISTS sitemap_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    change_frequency TEXT CHECK (change_frequency IN ('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never')),
    priority DECIMAL CHECK (priority >= 0 AND priority <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to automatically update sitemap entries
CREATE OR REPLACE FUNCTION update_sitemap_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- Update existing entry or insert new one
    INSERT INTO sitemap_entries (url, last_modified, change_frequency, priority)
    VALUES (
        NEW.page_path,
        NOW(),
        CASE 
            WHEN NEW.page_path LIKE '/products/%' THEN 'daily'
            WHEN NEW.page_path LIKE '/rankings%' THEN 'hourly'
            ELSE 'weekly'
        END,
        CASE 
            WHEN NEW.page_path = '/' THEN 1.0
            WHEN NEW.page_path LIKE '/products/%' THEN 0.8
            WHEN NEW.page_path LIKE '/rankings%' THEN 0.9
            ELSE 0.5
        END
    )
    ON CONFLICT (url) DO UPDATE
    SET last_modified = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sitemap updates
CREATE TRIGGER update_sitemap
    AFTER INSERT OR UPDATE ON seo_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_sitemap_entry();

-- Function to generate robots.txt content
CREATE OR REPLACE FUNCTION get_robots_txt()
RETURNS TEXT AS $$
BEGIN
    RETURN E'User-agent: *\n' ||
           E'Allow: /\n' ||
           E'Disallow: /api/\n' ||
           E'Disallow: /auth/\n' ||
           E'Disallow: /settings/\n' ||
           E'Sitemap: ' || current_setting('app.frontend_url') || '/sitemap.xml';
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitemap_entries ENABLE ROW LEVEL SECURITY;

-- Allow public read access to SEO metadata
CREATE POLICY "Public read access to SEO metadata"
    ON seo_metadata FOR SELECT
    TO PUBLIC
    USING (true);

-- Allow public read access to sitemap entries
CREATE POLICY "Public read access to sitemap entries"
    ON sitemap_entries FOR SELECT
    TO PUBLIC
    USING (true);

-- Only allow authenticated service role to modify SEO data
CREATE POLICY "Service role can modify SEO metadata"
    ON seo_metadata FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_seo_metadata_page_path ON seo_metadata(page_path);
CREATE UNIQUE INDEX idx_sitemap_entries_url ON sitemap_entries(url);

-- Insert initial SEO metadata for main pages
INSERT INTO seo_metadata (page_path, title, description, keywords, og_title, og_description)
VALUES 
    ('/', 'Gaming Gear Rankings - Find Your Perfect Gaming Setup', 'Discover top-rated gaming gear ranked by real gamers. Compare mice, keyboards, headsets, and monitors.', ARRAY['gaming gear', 'gaming setup', 'gaming peripherals', 'gaming equipment'], 'Gaming Gear Rankings', 'Find the best gaming gear ranked by real gamers'),
    ('/rankings', 'Top Ranked Gaming Products - Gaming Gear Rankings', 'Browse the highest-rated gaming products across all categories. Updated in real-time based on user votes and reviews.', ARRAY['gaming rankings', 'top gaming gear', 'best gaming products'], 'Top Ranked Gaming Products', 'See what gamers are voting as the best gaming gear'),
    ('/products', 'Gaming Products Catalog - Gaming Gear Rankings', 'Explore our complete catalog of gaming peripherals and equipment. Find detailed specs, reviews, and comparisons.', ARRAY['gaming products', 'gaming peripherals', 'gaming equipment catalog'], 'Gaming Products Catalog', 'Browse our complete gaming gear catalog')
ON CONFLICT (page_path) DO UPDATE
SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    keywords = EXCLUDED.keywords,
    og_title = EXCLUDED.og_title,
    og_description = EXCLUDED.og_description,
    updated_at = NOW(); 