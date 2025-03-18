import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API endpoint to apply migrations to fix voting and other functions
 */
export async function POST(request: NextRequest) {
  try {
    // Create a response array to track progress
    const results = [];
    
    // Apply key migration that was missing - the vote_for_product function with
    // parameters in the order expected by the client code
    try {
      console.log('Adding vote_for_product with correct parameter order...');
      
      // This is the critical fix - create a function with parameters in the correct order
      const fixedVoteFunction = `
        CREATE OR REPLACE FUNCTION public.vote_for_product(
          p_client_id TEXT,
          p_product_id UUID,
          p_user_id UUID,
          p_vote_type INTEGER
        )
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        DECLARE
          v_existing_vote_id UUID;
          v_existing_vote_type INTEGER;
          v_upvotes INTEGER;
          v_downvotes INTEGER;
        BEGIN
          -- Check if this client has already voted
          SELECT id, vote_type INTO v_existing_vote_id, v_existing_vote_type
          FROM votes
          WHERE 
            product_id = p_product_id
            AND metadata->>'client_id' = p_client_id
          LIMIT 1;
          
          -- Handle the vote
          IF v_existing_vote_id IS NULL THEN
            -- New vote
            INSERT INTO votes (
              product_id, 
              user_id, 
              vote_type, 
              metadata
            ) VALUES (
              p_product_id, 
              p_user_id, 
              p_vote_type, 
              jsonb_build_object(
                'client_id', p_client_id,
                'ip', NULL,
                'user_agent', NULL
              )
            );
          ELSIF v_existing_vote_type = p_vote_type THEN
            -- Remove vote if clicking the same button
            DELETE FROM votes WHERE id = v_existing_vote_id;
            -- Set to null to indicate vote was removed
            p_vote_type := NULL;
          ELSE
            -- Change vote
            UPDATE votes 
            SET 
              vote_type = p_vote_type,
              updated_at = now() 
            WHERE id = v_existing_vote_id;
          END IF;
          
          -- Count all votes for this product
          SELECT 
            COUNT(*) FILTER (WHERE vote_type = 1) AS upvotes,
            COUNT(*) FILTER (WHERE vote_type = -1) AS downvotes
          INTO v_upvotes, v_downvotes
          FROM votes
          WHERE product_id = p_product_id;
          
          -- Return the result
          RETURN jsonb_build_object(
            'hasVoted', p_vote_type IS NOT NULL,
            'voteType', p_vote_type,
            'upvotes', v_upvotes,
            'downvotes', v_downvotes,
            'score', v_upvotes - v_downvotes
          );
        EXCEPTION
          WHEN OTHERS THEN
            RETURN jsonb_build_object(
              'hasVoted', false,
              'voteType', NULL,
              'upvotes', 0,
              'downvotes', 0,
              'score', 0,
              'error', SQLERRM
            );
        END;
        $$;
        
        GRANT EXECUTE ON FUNCTION public.vote_for_product(TEXT, UUID, UUID, INTEGER) TO anon, authenticated, service_role;
      `;
      
      // Apply the function
      const { error: functionError } = await supabaseServer.rpc('execute_sql', { 
        sql: fixedVoteFunction 
      });
      
      if (functionError) {
        console.error('Error creating vote function with correct parameter order:', functionError);
        
        // Try to create the votes table first if it doesn't exist
        const createTableSql = `
          CREATE TABLE IF NOT EXISTS public.votes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            product_id UUID NOT NULL,
            user_id UUID,
            vote_type INTEGER NOT NULL,
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
          );
          
          ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
          DROP POLICY IF EXISTS "Allow read access for all users" ON public.votes;
          CREATE POLICY "Allow read access for all users" ON public.votes FOR SELECT USING (true);
          DROP POLICY IF EXISTS "Allow insert/update for authenticated users" ON public.votes;
          CREATE POLICY "Allow insert/update for authenticated users" ON public.votes FOR ALL USING (true) WITH CHECK (true);
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.votes TO anon, authenticated, service_role;
        `;
        
        await supabaseServer.rpc('execute_sql', { sql: createTableSql });
        
        // Try again after creating the table
        const { error: retryError } = await supabaseServer.rpc('execute_sql', { 
          sql: fixedVoteFunction 
        });
        
        results.push({
          step: 'Create vote_for_product with correct parameter order',
          success: !retryError,
          error: retryError ? retryError.message : null
        });
      } else {
        results.push({
          step: 'Create vote_for_product with correct parameter order',
          success: true
        });
      }
    } catch (functionError) {
      console.error('Exception creating vote function:', functionError);
      results.push({
        step: 'Create vote_for_product with correct parameter order',
        success: false,
        error: functionError instanceof Error ? functionError.message : String(functionError)
      });
    }
    
    // Read and execute the comprehensive migration file
    try {
      console.log('Reading comprehensive migration file');
      const completeMigrationPath = path.join(process.cwd(), 'supabase/migrations/complete_vote_migration.sql');
      
      let migrationSql;
      try {
        migrationSql = fs.readFileSync(completeMigrationPath, 'utf8');
        console.log('Migration file loaded successfully, length:', migrationSql.length);
      } catch (readError) {
        console.error('Error reading migration file:', readError);
        
        // Use hardcoded SQL as fallback if file not accessible in production
        migrationSql = `
-- Hardcoded fallback migration (simplified version)
-- Create the votes table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'votes') THEN
    CREATE TABLE public.votes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      product_id UUID NOT NULL,
      user_id UUID,
      vote_type INTEGER NOT NULL,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;
END$$;

-- Function to check if user voted
CREATE OR REPLACE FUNCTION public.has_user_voted(p_product_id UUID, p_client_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_vote_id UUID; v_vote_type INTEGER; v_upvotes INTEGER; v_downvotes INTEGER;
BEGIN
  SELECT id, vote_type INTO v_vote_id, v_vote_type FROM votes 
  WHERE product_id = p_product_id AND metadata->>'client_id' = p_client_id LIMIT 1;
  
  SELECT COUNT(*) FILTER (WHERE vote_type = 1) AS up, COUNT(*) FILTER (WHERE vote_type = -1) AS down
  INTO v_upvotes, v_downvotes FROM votes WHERE product_id = p_product_id;
  
  RETURN jsonb_build_object('hasVoted', v_vote_id IS NOT NULL, 'voteType', v_vote_type, 
    'upvotes', v_upvotes, 'downvotes', v_downvotes, 'score', v_upvotes - v_downvotes);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('hasVoted', false, 'voteType', null, 'upvotes', 0, 'downvotes', 0, 'score', 0);
END; $$;

-- Also add function with original parameter order
CREATE OR REPLACE FUNCTION public.vote_for_product(p_product_id UUID, p_vote_type INTEGER, p_client_id TEXT, p_user_id UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_existing_vote_id UUID; v_existing_vote_type INTEGER; v_upvotes INTEGER; v_downvotes INTEGER;
BEGIN
  SELECT id, vote_type INTO v_existing_vote_id, v_existing_vote_type FROM votes 
  WHERE product_id = p_product_id AND metadata->>'client_id' = p_client_id LIMIT 1;
  
  IF v_existing_vote_id IS NULL THEN
    INSERT INTO votes (product_id, user_id, vote_type, metadata) 
    VALUES (p_product_id, p_user_id, p_vote_type, jsonb_build_object('client_id', p_client_id));
  ELSIF v_existing_vote_type = p_vote_type THEN
    DELETE FROM votes WHERE id = v_existing_vote_id;
    p_vote_type := NULL;
  ELSE
    UPDATE votes SET vote_type = p_vote_type, updated_at = now() WHERE id = v_existing_vote_id;
  END IF;
  
  SELECT COUNT(*) FILTER (WHERE vote_type = 1) AS up, COUNT(*) FILTER (WHERE vote_type = -1) AS down
  INTO v_upvotes, v_downvotes FROM votes WHERE product_id = p_product_id;
  
  RETURN jsonb_build_object('hasVoted', p_vote_type IS NOT NULL, 'voteType', p_vote_type, 
    'upvotes', v_upvotes, 'downvotes', v_downvotes, 'score', v_upvotes - v_downvotes);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('hasVoted', false, 'voteType', NULL, 'upvotes', 0, 'downvotes', 0, 'score', 0);
END; $$;

-- Function to check remaining votes
CREATE OR REPLACE FUNCTION public.get_remaining_client_votes(p_client_id text, p_max_votes integer DEFAULT 5)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_total_votes integer; v_remaining_votes integer;
BEGIN
  SELECT COUNT(*) INTO v_total_votes FROM votes 
  WHERE metadata->>'client_id' = p_client_id AND user_id IS NULL AND created_at > (NOW() - INTERVAL '24 hours');
  
  v_remaining_votes := GREATEST(0, p_max_votes - v_total_votes);
  RETURN jsonb_build_object('remaining_votes', v_remaining_votes, 'total_votes', v_total_votes, 'max_votes', p_max_votes);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('remaining_votes', 0, 'total_votes', 0, 'max_votes', p_max_votes);
END; $$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.has_user_voted(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vote_for_product(UUID, INTEGER, TEXT, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_remaining_client_votes(TEXT, INTEGER) TO anon, authenticated, service_role;
        `;
      }
      
      // Try to apply the whole script together
      try {
        // Apply the migration SQL using stored procedure method in Supabase
        console.log('Executing migration SQL as a whole...');
        
        // First try running the SQL directly as a stored procedure
        const { error: migrationError } = await supabaseServer.rpc('execute_sql', { 
          sql: migrationSql 
        });
        
        if (migrationError) {
          console.error('Migration SQL execution failed:', migrationError);
          results.push({
            step: 'Apply migration SQL (whole script)',
            success: false,
            error: migrationError.message
          });
          
          // If the whole script fails, try individual functions
          console.log('Attempting to apply functions individually...');
          
          // These are the critical function definitions to try individually
          const functionSections = [
            {
              name: 'Create votes table',
              sql: `DO $$
              BEGIN
                IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'votes') THEN
                  CREATE TABLE public.votes (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    product_id UUID NOT NULL,
                    user_id UUID,
                    vote_type INTEGER NOT NULL,
                    metadata JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMPTZ DEFAULT now(),
                    updated_at TIMESTAMPTZ DEFAULT now()
                  );
                END IF;
              END$$;`
            },
            {
              name: 'Create has_user_voted function',
              sql: `CREATE OR REPLACE FUNCTION public.has_user_voted(p_product_id UUID, p_client_id TEXT)
              RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
              DECLARE
                v_vote_id UUID; v_vote_type INTEGER; v_upvotes INTEGER; v_downvotes INTEGER;
              BEGIN
                SELECT id, vote_type INTO v_vote_id, v_vote_type FROM votes 
                WHERE product_id = p_product_id AND metadata->>'client_id' = p_client_id LIMIT 1;
                
                SELECT COUNT(*) FILTER (WHERE vote_type = 1) AS up, COUNT(*) FILTER (WHERE vote_type = -1) AS down
                INTO v_upvotes, v_downvotes FROM votes WHERE product_id = p_product_id;
                
                RETURN jsonb_build_object('hasVoted', v_vote_id IS NOT NULL, 'voteType', v_vote_type, 
                  'upvotes', v_upvotes, 'downvotes', v_downvotes, 'score', v_upvotes - v_downvotes);
              EXCEPTION WHEN OTHERS THEN
                RETURN jsonb_build_object('hasVoted', false, 'voteType', null, 'upvotes', 0, 'downvotes', 0, 'score', 0);
              END; $$;`
            },
            {
              name: 'Create get_remaining_client_votes function',
              sql: `CREATE OR REPLACE FUNCTION public.get_remaining_client_votes(p_client_id text, p_max_votes integer DEFAULT 5)
              RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
              DECLARE v_total_votes integer; v_remaining_votes integer;
              BEGIN
                SELECT COUNT(*) INTO v_total_votes FROM votes 
                WHERE metadata->>'client_id' = p_client_id AND user_id IS NULL AND created_at > (NOW() - INTERVAL '24 hours');
                
                v_remaining_votes := GREATEST(0, p_max_votes - v_total_votes);
                RETURN jsonb_build_object('remaining_votes', v_remaining_votes, 'total_votes', v_total_votes, 'max_votes', p_max_votes);
              EXCEPTION WHEN OTHERS THEN
                RETURN jsonb_build_object('remaining_votes', 0, 'total_votes', 0, 'max_votes', p_max_votes);
              END; $$;`
            },
            {
              name: 'Grant permissions',
              sql: `GRANT EXECUTE ON FUNCTION public.has_user_voted(UUID, TEXT) TO anon, authenticated, service_role;
              GRANT EXECUTE ON FUNCTION public.vote_for_product(TEXT, UUID, UUID, INTEGER) TO anon, authenticated, service_role;
              GRANT EXECUTE ON FUNCTION public.vote_for_product(UUID, INTEGER, TEXT, UUID) TO anon, authenticated, service_role;
              GRANT EXECUTE ON FUNCTION public.get_remaining_client_votes(TEXT, INTEGER) TO anon, authenticated, service_role;
              GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.votes TO anon, authenticated, service_role;`
            }
          ];
          
          // Apply each function section individually
          let individualSuccessCount = 0;
          
          for (const section of functionSections) {
            try {
              const { error: sectionError } = await supabaseServer.rpc('execute_sql', { 
                sql: section.sql 
              });
              
              results.push({
                step: `Apply ${section.name}`,
                success: !sectionError,
                error: sectionError ? sectionError.message : null
              });
              
              if (!sectionError) {
                individualSuccessCount++;
              }
            } catch (sectionApplyError) {
              console.error(`Error applying ${section.name}:`, sectionApplyError);
              results.push({
                step: `Apply ${section.name}`,
                success: false,
                error: sectionApplyError instanceof Error ? sectionApplyError.message : String(sectionApplyError)
              });
            }
          }
          
          console.log(`Applied ${individualSuccessCount} out of ${functionSections.length} function sections individually`);
        } else {
          // Success with the whole script
          results.push({
            step: 'Apply migration SQL',
            success: true,
            data: 'All SQL applied successfully'
          });
        }
      } catch (executeError) {
        console.error('Exception executing migration SQL:', executeError);
        results.push({
          step: 'Apply migration SQL',
          success: false,
          error: executeError instanceof Error ? executeError.message : String(executeError)
        });
      }
      
    } catch (error) {
      console.error('Migration application error:', error);
      results.push({
        step: 'Apply comprehensive migration',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Test the vote functions
    try {
      console.log('Testing vote functions...');
      
      // Test the has_user_voted function
      const testProductId = '00000000-0000-0000-0000-000000000001';
      const testClientId = 'test-migration-' + Date.now();
      
      const { data: voteCheckData, error: voteCheckError } = await supabaseServer.rpc('has_user_voted', {
        p_product_id: testProductId,
        p_client_id: testClientId
      });
      
      results.push({
        step: 'Test has_user_voted function',
        success: !voteCheckError,
        data: voteCheckData,
        error: voteCheckError ? voteCheckError.message : null
      });
      
      // Test the vote_for_product function (with new parameter order)
      const { data: voteData, error: voteError } = await supabaseServer.rpc('vote_for_product', {
        p_client_id: testClientId,
        p_product_id: testProductId,
        p_user_id: null,
        p_vote_type: 1
      });
      
      results.push({
        step: 'Test vote_for_product function (new parameter order)',
        success: !voteError,
        data: voteData,
        error: voteError ? voteError.message : null
      });
      
      // Test the get_remaining_client_votes function
      const { data: remainingVotesData, error: remainingVotesError } = await supabaseServer.rpc('get_remaining_client_votes', {
        p_client_id: testClientId,
        p_max_votes: 5
      });
      
      results.push({
        step: 'Test get_remaining_client_votes function',
        success: !remainingVotesError,
        data: remainingVotesData,
        error: remainingVotesError ? remainingVotesError.message : null
      });
      
    } catch (error) {
      console.error('Error testing vote functions:', error);
      results.push({
        step: 'Test vote functions',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Determine overall success
    const overallSuccess = results.filter(r => r.success === false).length === 0;
    
    return NextResponse.json({
      success: overallSuccess,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Unhandled error in apply-migration:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to apply migrations',
    timestamp: new Date().toISOString()
  });
} 