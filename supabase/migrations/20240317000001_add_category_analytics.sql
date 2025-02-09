-- Create category_analytics table
CREATE TABLE category_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  views BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  trending_score DECIMAL(10,2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id)
);

-- Create function to update trending score
CREATE OR REPLACE FUNCTION update_category_trending_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate trending score based on views, clicks, and time decay
  -- Score = (views * 0.3 + clicks * 0.7) * exp(-0.1 * extract(epoch from (NOW() - updated_at))/3600)
  NEW.trending_score = (NEW.views * 0.3 + NEW.clicks * 0.7) * 
    EXP(-0.1 * EXTRACT(EPOCH FROM (NOW() - NEW.updated_at))/3600);
  
  -- Calculate conversion rate
  IF NEW.views > 0 THEN
    NEW.conversion_rate = (NEW.clicks::DECIMAL / NEW.views::DECIMAL) * 100;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating trending score
CREATE TRIGGER update_category_trending
  BEFORE UPDATE ON category_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_category_trending_score();

-- Create function to increment category views
CREATE OR REPLACE FUNCTION increment_category_views(category TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO category_analytics (category_id, views)
  VALUES (category, 1)
  ON CONFLICT (category_id)
  DO UPDATE SET 
    views = category_analytics.views + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to increment category clicks
CREATE OR REPLACE FUNCTION increment_category_clicks(category TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO category_analytics (category_id, clicks)
  VALUES (category, 1)
  ON CONFLICT (category_id)
  DO UPDATE SET 
    clicks = category_analytics.clicks + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable real-time for category analytics
ALTER PUBLICATION supabase_realtime ADD TABLE category_analytics;

-- Add RLS policies
ALTER TABLE category_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to category analytics"
  ON category_analytics
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to update category analytics"
  ON category_analytics
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create materialized view for trending categories
CREATE MATERIALIZED VIEW trending_categories AS
SELECT 
  c.id,
  c.name,
  c.description,
  c.icon,
  ca.views,
  ca.clicks,
  ca.trending_score,
  ca.conversion_rate,
  COUNT(p.id) as product_count
FROM categories c
LEFT JOIN category_analytics ca ON c.id = ca.category_id
LEFT JOIN products p ON c.id = p.category
GROUP BY c.id, c.name, c.description, c.icon, ca.views, ca.clicks, ca.trending_score, ca.conversion_rate
ORDER BY ca.trending_score DESC NULLS LAST;

-- Create function to refresh trending categories
CREATE OR REPLACE FUNCTION refresh_trending_categories()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW trending_categories;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh trending categories
CREATE TRIGGER refresh_trending_categories_trigger
  AFTER INSERT OR UPDATE OR DELETE ON category_analytics
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_trending_categories(); 