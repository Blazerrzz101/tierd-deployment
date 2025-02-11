-- Create user_details table
CREATE TABLE IF NOT EXISTS public.user_details (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE,
  is_online BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.user_details ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow public read access" ON public.user_details;
  DROP POLICY IF EXISTS "Allow users to update their own details" ON public.user_details;
  DROP POLICY IF EXISTS "Allow authenticated users to insert their own details" ON public.user_details;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create new policies
CREATE POLICY "Allow public read access"
  ON public.user_details FOR SELECT
  USING (true);

CREATE POLICY "Allow users to update their own details"
  ON public.user_details FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to insert their own details"
  ON public.user_details FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.user_details TO anon, authenticated;
GRANT UPDATE(username, avatar_url) ON public.user_details TO authenticated;
GRANT INSERT ON public.user_details TO authenticated;

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_details (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update last_seen and is_online
CREATE OR REPLACE FUNCTION public.update_user_status()
RETURNS trigger AS $$
BEGIN
  UPDATE public.user_details
  SET 
    last_seen = TIMEZONE('utc'::text, NOW()),
    is_online = true
  WHERE id = auth.uid();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user activity
DROP TRIGGER IF EXISTS on_user_activity ON auth.users;
CREATE TRIGGER on_user_activity
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.update_user_status(); 