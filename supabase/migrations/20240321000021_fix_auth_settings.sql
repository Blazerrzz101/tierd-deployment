-- Update auth settings
INSERT INTO auth.config (key, value)
VALUES 
  ('site_url', '"http://localhost:3000"'),
  ('additional_redirect_urls', '["http://localhost:3000/auth/callback"]'),
  ('enable_email_signup', 'true'),
  ('enable_email_autoconfirm', 'false')
ON CONFLICT (key) 
DO UPDATE SET value = EXCLUDED.value;

-- Create function to migrate anonymous votes
CREATE OR REPLACE FUNCTION public.migrate_anonymous_votes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the new user has client_id in metadata
  IF NEW.raw_user_meta_data->>'client_id' IS NOT NULL THEN
    -- Update votes table to associate anonymous votes with the new user
    UPDATE public.votes
    SET 
      user_id = NEW.id,
      updated_at = now()
    WHERE 
      client_id = NEW.raw_user_meta_data->>'client_id'
      AND user_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to migrate votes on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.migrate_anonymous_votes();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role; 