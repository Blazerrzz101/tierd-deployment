-- Create thread_mentions table
CREATE TABLE thread_mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(thread_id, product_id)
);

-- Create function to extract and save product mentions
CREATE OR REPLACE FUNCTION process_product_mentions()
RETURNS TRIGGER AS $$
DECLARE
  mention RECORD;
  product_id UUID;
BEGIN
  -- Delete existing mentions for this thread
  DELETE FROM thread_mentions WHERE thread_id = NEW.id;
  
  -- Extract product mentions from content (format: @[product-slug])
  FOR mention IN 
    SELECT DISTINCT matches[1] AS slug
    FROM regexp_matches(NEW.content, '@\[([^\]]+)\]', 'g') AS matches
  LOOP
    -- Find product by slug
    SELECT id INTO product_id
    FROM products
    WHERE url_slug = mention.slug;
    
    -- If product exists, create mention
    IF product_id IS NOT NULL THEN
      INSERT INTO thread_mentions (thread_id, product_id)
      VALUES (NEW.id, product_id)
      ON CONFLICT (thread_id, product_id) DO NOTHING;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for processing mentions
CREATE TRIGGER process_thread_mentions
  AFTER INSERT OR UPDATE OF content ON threads
  FOR EACH ROW
  EXECUTE FUNCTION process_product_mentions();

-- Enable RLS
ALTER TABLE thread_mentions ENABLE ROW LEVEL SECURITY;

-- RLS policies for thread_mentions
CREATE POLICY "Allow public read access to thread mentions"
  ON thread_mentions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to create mentions"
  ON thread_mentions
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM threads
    WHERE id = thread_id
    AND user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_thread_mentions_thread_id ON thread_mentions(thread_id);
CREATE INDEX idx_thread_mentions_product_id ON thread_mentions(product_id);

-- Add trigger to notify mentioned products
CREATE OR REPLACE FUNCTION notify_product_mention()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for product owner/followers
  INSERT INTO notifications (
    user_id,
    type,
    data,
    read
  )
  SELECT 
    user_id,
    'product_mention',
    jsonb_build_object(
      'thread_id', NEW.thread_id,
      'product_id', NEW.product_id
    ),
    false
  FROM product_followers
  WHERE product_id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_product_mention
  AFTER INSERT ON thread_mentions
  FOR EACH ROW
  EXECUTE FUNCTION notify_product_mention(); 