-- Function to execute arbitrary SQL for migrations
-- IMPORTANT: This function should ONLY be callable by admins/service roles
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Only grant to service role
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM anon, authenticated; 