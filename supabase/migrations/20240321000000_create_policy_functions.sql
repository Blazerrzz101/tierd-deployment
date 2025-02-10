-- Function to enable/disable RLS
CREATE OR REPLACE FUNCTION set_rls_enabled(table_name text, enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY %s',
    table_name,
    CASE WHEN enabled THEN 'ENABLE' ELSE 'DISABLE' END
  );
END;
$$;

-- Function to create a SELECT policy
CREATE OR REPLACE FUNCTION create_select_policy(
  table_name text,
  policy_name text,
  using_expression text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Drop existing policy if it exists
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I',
    policy_name,
    table_name
  );
  
  -- Create new policy
  EXECUTE format('CREATE POLICY %I ON %I
    FOR SELECT
    TO public
    USING (%s)',
    policy_name,
    table_name,
    using_expression
  );
END;
$$;

-- Function to grant permissions
CREATE OR REPLACE FUNCTION grant_permissions(
  table_name text,
  role_name text,
  permissions text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  permission text;
BEGIN
  -- Grant usage on schema
  EXECUTE format('GRANT USAGE ON SCHEMA public TO %I',
    role_name
  );
  
  -- Grant specified permissions
  FOREACH permission IN ARRAY permissions
  LOOP
    EXECUTE format('GRANT %s ON %I TO %I',
      permission,
      table_name,
      role_name
    );
  END LOOP;
END;
$$; 