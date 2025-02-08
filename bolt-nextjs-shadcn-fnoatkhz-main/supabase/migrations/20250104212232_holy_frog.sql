/*
  # Initial Database Schema

  1. New Tables
    - users
      - id (uuid, primary key)
      - username (text, unique)
      - email (text, unique)
      - avatar_url (text)
      - is_online (boolean)
      - is_public (boolean)
      - created_at (timestamptz)
      - last_seen (timestamptz)
    
    - activities
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - type (text)
      - product_id (text)
      - product_name (text)
      - action (text)
      - created_at (timestamptz)

    - user_preferences
      - user_id (uuid, primary key)
      - preferred_accessories (text[])
      - notification_settings (jsonb)
      - privacy_settings (jsonb)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Users Table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  avatar_url text,
  is_online boolean DEFAULT false,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read public profiles"
  ON users FOR SELECT
  USING (is_public OR auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Activities Table
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  product_id text NOT NULL,
  product_name text NOT NULL,
  action text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read activities of public profiles"
  ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = activities.user_id
      AND (users.is_public OR users.id = auth.uid())
    )
  );

CREATE POLICY "Users can create own activities"
  ON activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User Preferences Table
CREATE TABLE user_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferred_accessories text[] DEFAULT '{}',
  notification_settings jsonb DEFAULT '{
    "emailNotifications": true,
    "productUpdates": true,
    "communityActivity": true,
    "mentions": true
  }'::jsonb,
  privacy_settings jsonb DEFAULT '{
    "showActivity": true,
    "showPreferences": true
  }'::jsonb
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read preferences of public profiles"
  ON user_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_preferences.user_id
      AND (users.is_public OR users.id = auth.uid())
    )
  );

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);