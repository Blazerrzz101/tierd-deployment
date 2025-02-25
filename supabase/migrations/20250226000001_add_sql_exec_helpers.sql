-- Create functions to execute SQL directly for fixing database functions
-- This is useful when migrations have issues or need to be applied selectively

-- Function to execute arbitrary SQL
CREATE OR REPLACE FUNCTION public.exec_sql(
    sql text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    EXECUTE sql;
END;
$$;

-- Only grant to authenticated users with admin role
ALTER FUNCTION public.exec_sql(text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- Function to execute SQL in smaller chunks
CREATE OR REPLACE FUNCTION public.direct_sql_exec(
    sql_script text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    statements text[];
    statement text;
    result jsonb := '{}'::jsonb;
    execution_count integer := 0;
    error_count integer := 0;
    error_messages jsonb := '[]'::jsonb;
BEGIN
    -- Split the script by semicolons followed by newlines to get individual statements
    -- This is a simplistic approach and might not work for all SQL scripts
    statements := regexp_split_to_array(sql_script, E';\\s*\\n');
    
    FOR i IN 1..array_length(statements, 1) LOOP
        statement := trim(statements[i]);
        
        -- Skip empty statements
        IF length(statement) > 5 THEN
            BEGIN
                EXECUTE statement;
                execution_count := execution_count + 1;
            EXCEPTION WHEN OTHERS THEN
                error_count := error_count + 1;
                error_messages := error_messages || jsonb_build_object(
                    'statement', statement,
                    'error', SQLERRM
                );
            END;
        END IF;
    END LOOP;
    
    -- Build result summary
    result := jsonb_build_object(
        'executed', execution_count,
        'errors', error_count,
        'error_details', error_messages
    );
    
    RETURN result;
END;
$$;

-- Only grant to authenticated users with admin role
ALTER FUNCTION public.direct_sql_exec(text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.direct_sql_exec(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.direct_sql_exec(text) TO service_role; 