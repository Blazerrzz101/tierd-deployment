-- Schema setup
CREATE TABLE products (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    ranking INTEGER DEFAULT 0
);

-- Functions and triggers
CREATE OR REPLACE FUNCTION calculate_rankings() RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET ranking = (
        SELECT COUNT(*)
        FROM votes
        WHERE votes.product_id = products.id
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_rankings_trigger() RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_rankings();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rankings
AFTER INSERT OR DELETE ON votes
FOR EACH STATEMENT
EXECUTE FUNCTION update_rankings_trigger();
