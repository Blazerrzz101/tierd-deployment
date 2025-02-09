-- Create product_reviews table
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Create helpful_reviews table to track which users found reviews helpful
CREATE TABLE helpful_reviews (
  review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (review_id, user_id)
);

-- Create function to increment helpful count
CREATE OR REPLACE FUNCTION increment_helpful_count(review_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO helpful_reviews (review_id, user_id)
  VALUES (review_id, auth.uid())
  ON CONFLICT DO NOTHING;

  UPDATE product_reviews
  SET helpful_count = helpful_count + 1
  WHERE id = review_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update product rating
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  WITH review_stats AS (
    SELECT 
      product_id,
      AVG(rating) as avg_rating,
      COUNT(*) as review_count
    FROM product_reviews
    WHERE product_id = NEW.product_id
    GROUP BY product_id
  )
  UPDATE products
  SET 
    rating = review_stats.avg_rating,
    review_count = review_stats.review_count
  FROM review_stats
  WHERE products.id = review_stats.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating product rating
CREATE TRIGGER update_product_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- Enable RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE helpful_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_reviews
CREATE POLICY "Allow public read access to product reviews"
  ON product_reviews
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to create reviews"
  ON product_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own reviews"
  ON product_reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own reviews"
  ON product_reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS policies for helpful_reviews
CREATE POLICY "Allow public read access to helpful reviews"
  ON helpful_reviews
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to mark reviews as helpful"
  ON helpful_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_created_at ON product_reviews(created_at);
CREATE INDEX idx_helpful_reviews_review_id ON helpful_reviews(review_id);
CREATE INDEX idx_helpful_reviews_user_id ON helpful_reviews(user_id); 