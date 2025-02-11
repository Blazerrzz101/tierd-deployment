# Database Schema Documentation

This document provides a detailed overview of the Tier'd database schema, including tables, relationships, indexes, and security policies.

## Overview

The database is built on PostgreSQL and uses Supabase for real-time functionality and Row Level Security (RLS).

## Tables

### users

Stores user account information.

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  username      TEXT UNIQUE NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_seen_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX users_email_idx ON users (email);
CREATE INDEX users_username_idx ON users (username);
```

### products

Stores product information.

```sql
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL,
  votes_count   INTEGER DEFAULT 0 NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX products_category_idx ON products (category);
CREATE INDEX products_votes_count_idx ON products (votes_count DESC);
CREATE INDEX products_created_at_idx ON products (created_at DESC);
```

### votes

Stores user votes on products.

```sql
CREATE TYPE vote_type AS ENUM ('up', 'down');

CREATE TABLE votes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  client_ip     TEXT,
  type          vote_type NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure either user_id or client_ip is present, but not both
  CONSTRAINT votes_user_or_ip_check CHECK (
    (user_id IS NOT NULL AND client_ip IS NULL) OR
    (user_id IS NULL AND client_ip IS NOT NULL)
  ),
  
  -- Prevent duplicate votes
  CONSTRAINT votes_unique_user CHECK (
    CASE 
      WHEN user_id IS NOT NULL THEN 
        (SELECT COUNT(*) FROM votes WHERE votes.product_id = product_id AND votes.user_id = user_id) <= 1
      WHEN client_ip IS NOT NULL THEN
        (SELECT COUNT(*) FROM votes WHERE votes.product_id = product_id AND votes.client_ip = client_ip) <= 1
    END
  )
);

-- Indexes
CREATE INDEX votes_product_id_idx ON votes (product_id);
CREATE INDEX votes_user_id_idx ON votes (user_id);
CREATE INDEX votes_client_ip_idx ON votes (client_ip);
CREATE INDEX votes_created_at_idx ON votes (created_at DESC);
```

### threads

Stores discussion threads for products.

```sql
CREATE TABLE threads (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX threads_product_id_idx ON threads (product_id);
CREATE INDEX threads_created_by_idx ON threads (created_by);
CREATE INDEX threads_created_at_idx ON threads (created_at DESC);
```

### product_mentions

Stores product mentions in threads.

```sql
CREATE TABLE product_mentions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id     UUID REFERENCES threads(id) ON DELETE CASCADE NOT NULL,
  product_id    UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Prevent duplicate mentions
  UNIQUE (thread_id, product_id)
);

-- Indexes
CREATE INDEX product_mentions_thread_id_idx ON product_mentions (thread_id);
CREATE INDEX product_mentions_product_id_idx ON product_mentions (product_id);
```

## Views

### product_rankings

Materialized view for product rankings based on votes.

```sql
CREATE MATERIALIZED VIEW product_rankings AS
SELECT 
  p.id,
  p.name,
  p.category,
  p.votes_count,
  COUNT(DISTINCT t.id) as thread_count,
  COUNT(DISTINCT pm.id) as mention_count,
  (
    p.votes_count * 10 + 
    COUNT(DISTINCT t.id) * 2 + 
    COUNT(DISTINCT pm.id)
  ) as ranking_score
FROM products p
LEFT JOIN threads t ON t.product_id = p.id
LEFT JOIN product_mentions pm ON pm.product_id = p.id
GROUP BY p.id, p.name, p.category, p.votes_count;

-- Indexes
CREATE UNIQUE INDEX product_rankings_id_idx ON product_rankings (id);
CREATE INDEX product_rankings_score_idx ON product_rankings (ranking_score DESC);
```

## Functions

### refresh_product_rankings()

Refreshes the product rankings materialized view.

```sql
CREATE OR REPLACE FUNCTION refresh_product_rankings()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### check_vote_limit(user_id UUID)

Checks if a user has reached their daily vote limit.

```sql
CREATE OR REPLACE FUNCTION check_vote_limit(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  vote_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO vote_count
  FROM votes
  WHERE votes.user_id = check_vote_limit.user_id
  AND created_at > NOW() - INTERVAL '1 day';
  
  RETURN vote_count < 50;
END;
$$ LANGUAGE plpgsql;
```

### check_anonymous_vote_limit(client_ip TEXT)

Checks if an anonymous user has reached their daily vote limit.

```sql
CREATE OR REPLACE FUNCTION check_anonymous_vote_limit(client_ip TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  vote_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO vote_count
  FROM votes
  WHERE votes.client_ip = check_anonymous_vote_limit.client_ip
  AND created_at > NOW() - INTERVAL '1 day';
  
  RETURN vote_count < 5;
END;
$$ LANGUAGE plpgsql;
```

## Triggers

### update_product_votes_count

Updates the votes count on a product when votes change.

```sql
CREATE TRIGGER update_product_votes_count
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION update_product_votes();

CREATE OR REPLACE FUNCTION update_product_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE products
    SET votes_count = (
      SELECT COUNT(*) FILTER (WHERE type = 'up') - COUNT(*) FILTER (WHERE type = 'down')
      FROM votes
      WHERE product_id = OLD.product_id
    )
    WHERE id = OLD.product_id;
  ELSE
    UPDATE products
    SET votes_count = (
      SELECT COUNT(*) FILTER (WHERE type = 'up') - COUNT(*) FILTER (WHERE type = 'down')
      FROM votes
      WHERE product_id = NEW.product_id
    )
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### refresh_rankings

Refreshes product rankings when relevant data changes.

```sql
CREATE TRIGGER refresh_rankings
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH STATEMENT EXECUTE FUNCTION refresh_product_rankings();

CREATE TRIGGER refresh_rankings_threads
AFTER INSERT OR UPDATE OR DELETE ON threads
FOR EACH STATEMENT EXECUTE FUNCTION refresh_product_rankings();

CREATE TRIGGER refresh_rankings_mentions
AFTER INSERT OR UPDATE OR DELETE ON product_mentions
FOR EACH STATEMENT EXECUTE FUNCTION refresh_product_rankings();
```

## Row Level Security (RLS)

### products

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone can view products
CREATE POLICY "Anyone can view products"
ON products FOR SELECT
TO public
USING (true);

-- Only authenticated users can create products
CREATE POLICY "Authenticated users can create products"
ON products FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Only product creators can update their products
CREATE POLICY "Users can update their own products"
ON products FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);
```

### votes

```sql
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Anyone can view votes
CREATE POLICY "Anyone can view votes"
ON votes FOR SELECT
TO public
USING (true);

-- Authenticated users can vote with rate limiting
CREATE POLICY "Authenticated users can vote with limits"
ON votes FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  check_vote_limit(auth.uid())
);

-- Anonymous users can vote with rate limiting
CREATE POLICY "Anonymous users can vote with limits"
ON votes FOR INSERT
TO public
WITH CHECK (
  client_ip IS NOT NULL AND
  check_anonymous_vote_limit(client_ip)
);

-- Users can only modify their own votes
CREATE POLICY "Users can modify their own votes"
ON votes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### threads

```sql
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

-- Anyone can view threads
CREATE POLICY "Anyone can view threads"
ON threads FOR SELECT
TO public
USING (true);

-- Only authenticated users can create threads
CREATE POLICY "Authenticated users can create threads"
ON threads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Only thread creators can update their threads
CREATE POLICY "Users can update their own threads"
ON threads FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);
```

## Indexes

### Performance Considerations

1. Primary Keys
   - All tables use UUID primary keys
   - Generated using `uuid_generate_v4()`

2. Foreign Keys
   - All foreign keys are indexed
   - Cascade deletes where appropriate

3. Sorting
   - Descending indexes on commonly sorted columns
   - Composite indexes for complex queries

4. Full Text Search
   - GiST indexes for product search
   - Trigram indexes for fuzzy matching

### Index List

```sql
-- users
CREATE INDEX users_email_idx ON users (email);
CREATE INDEX users_username_idx ON users (username);

-- products
CREATE INDEX products_category_idx ON products (category);
CREATE INDEX products_votes_count_idx ON products (votes_count DESC);
CREATE INDEX products_created_at_idx ON products (created_at DESC);
CREATE INDEX products_search_idx ON products USING GiST (
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- votes
CREATE INDEX votes_product_id_idx ON votes (product_id);
CREATE INDEX votes_user_id_idx ON votes (user_id);
CREATE INDEX votes_client_ip_idx ON votes (client_ip);
CREATE INDEX votes_created_at_idx ON votes (created_at DESC);

-- threads
CREATE INDEX threads_product_id_idx ON threads (product_id);
CREATE INDEX threads_created_by_idx ON threads (created_by);
CREATE INDEX threads_created_at_idx ON threads (created_at DESC);
CREATE INDEX threads_search_idx ON threads USING GiST (
  to_tsvector('english', title || ' ' || content)
);

-- product_mentions
CREATE INDEX product_mentions_thread_id_idx ON product_mentions (thread_id);
CREATE INDEX product_mentions_product_id_idx ON product_mentions (product_id);
```

## Extensions

Required PostgreSQL extensions:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- For password hashing
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- For query analysis
```

## Maintenance

### Materialized View Refresh

The `product_rankings` materialized view should be refreshed periodically:

```sql
-- Refresh every hour
SELECT cron.schedule(
  'refresh_rankings',
  '0 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings;'
);
```

### Vacuum

Regular vacuum is important for performance:

```sql
-- Analyze tables weekly
SELECT cron.schedule(
  'analyze_tables',
  '0 0 * * 0',
  'VACUUM ANALYZE;'
);
```

## Monitoring

Important metrics to monitor:

1. Table sizes
2. Index usage
3. Cache hit ratios
4. Lock contention
5. Long-running queries

Query for monitoring:

```sql
SELECT 
  schemaname,
  relname,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables;
``` 