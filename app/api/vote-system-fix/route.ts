import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API endpoint to fix the voting system by directly applying SQL migrations
 * This is a production emergency fix, not standard practice for migrations
 */
export async function POST(request: NextRequest) {
  try {
    // In production, you would add authentication checks here
    // E.g., require an admin token for this sensitive operation
    
    const body = await request.json();
    const { authToken } = body;
    
    // For production, always validate a proper admin token
    // This is a simplistic check - implement proper auth in production
    if (process.env.NODE_ENV === 'production' && authToken !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Apply specific SQL fixes based on what's needed
    const results: any[] = [];
    
    // 1. First apply the SQL exec helper functions
    try {
      const helperSqlPath = path.join(process.cwd(), 'supabase/migrations/20250226000001_add_sql_exec_helpers.sql');
      let helperSql = '';
      
      // Try to read the file, fall back to inline SQL if file not found
      try {
        helperSql = fs.readFileSync(helperSqlPath, 'utf8');
      } catch (e) {
        // Simplified inline version if file not accessible
        helperSql = `
          CREATE OR REPLACE FUNCTION public.exec_sql(sql text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN EXECUTE sql; END; $$;
          GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
        `;
      }
      
      // Execute the SQL directly via raw query
      const { error: helperError } = await supabaseServer.rpc('exec_sql', { 
        sql: helperSql 
      });
      
      results.push({
        step: 'Install helper functions',
        success: !helperError,
        error: helperError ? helperError.message : null
      });
    } catch (error) {
      results.push({
        step: 'Install helper functions',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // 2. Apply the vote function fix
    try {
      const fixSqlPath = path.join(process.cwd(), 'supabase/migrations/20250226000000_fix_vote_function_signature.sql');
      let fixSql = '';
      
      try {
        fixSql = fs.readFileSync(fixSqlPath, 'utf8');
      } catch (e) {
        // Basic inline version as fallback
        fixSql = `
          CREATE OR REPLACE FUNCTION public.vote_for_product(
              p_product_id uuid,
              p_vote_type integer,
              p_user_id uuid DEFAULT NULL,
              p_client_id text DEFAULT NULL
          )
          RETURNS jsonb
          LANGUAGE plpgsql
          SECURITY DEFINER
          SET search_path = public
          AS $$
          DECLARE
              v_existing_vote record;
              v_result_vote_type integer;
              v_upvotes integer;
              v_downvotes integer;
              result jsonb;
          BEGIN
              -- Check for existing vote by this user/client
              SELECT id, vote_type INTO v_existing_vote
              FROM votes
              WHERE product_id = p_product_id
              AND (
                  (user_id = p_user_id AND p_user_id IS NOT NULL)
                  OR
                  (user_id IS NULL AND metadata->>'client_id' = p_client_id AND p_client_id IS NOT NULL)
              );
          
              -- Handle the vote logic
              IF v_existing_vote IS NULL THEN
                  INSERT INTO votes (product_id, user_id, vote_type, metadata)
                  VALUES (
                      p_product_id,
                      p_user_id,
                      p_vote_type,
                      CASE WHEN p_user_id IS NULL THEN jsonb_build_object('client_id', p_client_id) ELSE '{}'::jsonb END
                  );
                  v_result_vote_type := p_vote_type;
              ELSIF v_existing_vote.vote_type = p_vote_type THEN
                  DELETE FROM votes WHERE id = v_existing_vote.id;
                  v_result_vote_type := NULL;
              ELSE
                  UPDATE votes SET vote_type = p_vote_type, updated_at = now()
                  WHERE id = v_existing_vote.id;
                  v_result_vote_type := p_vote_type;
              END IF;
          
              -- Count votes and update product
              SELECT 
                  COUNT(*) FILTER (WHERE vote_type = 1),
                  COUNT(*) FILTER (WHERE vote_type = -1)
              INTO v_upvotes, v_downvotes
              FROM votes
              WHERE product_id = p_product_id;
              
              -- Ensure values are integers
              v_upvotes := COALESCE(v_upvotes, 0)::integer;
              v_downvotes := COALESCE(v_downvotes, 0)::integer;
              
              -- Update product
              UPDATE products
              SET upvotes = v_upvotes,
                  downvotes = v_downvotes,
                  score = (v_upvotes - v_downvotes)::integer
              WHERE id = p_product_id;
              
              -- Return result
              RETURN jsonb_build_object(
                  'success', true,
                  'voteType', v_result_vote_type,
                  'upvotes', v_upvotes,
                  'downvotes', v_downvotes,
                  'score', (v_upvotes - v_downvotes)::integer
              );
          EXCEPTION WHEN OTHERS THEN
              RETURN jsonb_build_object('success', false, 'message', SQLERRM);
          END;
          $$;
          
          GRANT EXECUTE ON FUNCTION public.vote_for_product(uuid, integer, uuid, text) TO authenticated, anon;
          
          -- Also fix has_user_voted function
          CREATE OR REPLACE FUNCTION public.has_user_voted(
              p_product_id uuid,
              p_user_id uuid DEFAULT NULL,
              p_client_id text DEFAULT NULL
          )
          RETURNS jsonb
          LANGUAGE plpgsql
          SECURITY DEFINER
          SET search_path = public
          AS $$
          DECLARE
              v_vote_record record;
          BEGIN
              SELECT id, vote_type INTO v_vote_record
              FROM votes
              WHERE product_id = p_product_id
              AND (
                  (user_id = p_user_id AND p_user_id IS NOT NULL)
                  OR
                  (user_id IS NULL AND metadata->>'client_id' = p_client_id AND p_client_id IS NOT NULL)
              );
              
              RETURN jsonb_build_object(
                  'has_voted', v_vote_record.id IS NOT NULL,
                  'vote_type', v_vote_record.vote_type
              );
          EXCEPTION WHEN OTHERS THEN
              RETURN jsonb_build_object('has_voted', false, 'vote_type', NULL, 'error', SQLERRM);
          END;
          $$;
          
          GRANT EXECUTE ON FUNCTION public.has_user_voted(uuid, uuid, text) TO authenticated, anon;
        `;
      }
      
      // Execute the SQL directly
      const { error: fixError } = await supabaseServer.rpc('direct_sql_exec', { 
        sql_script: fixSql 
      });
      
      results.push({
        step: 'Fix vote functions',
        success: !fixError,
        error: fixError ? fixError.message : null
      });
    } catch (error) {
      results.push({
        step: 'Fix vote functions',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // 3. Test if the function works now
    try {
      const { data: testResult, error: testError } = await supabaseServer.rpc('vote_for_product', {
        p_product_id: '00000000-0000-0000-0000-000000000001', // Random test ID
        p_vote_type: 1,
        p_client_id: 'api-test-fix'
      });
      
      results.push({
        step: 'Test vote function',
        success: !testError,
        error: testError ? testError.message : null,
        result: testResult
      });
    } catch (error) {
      results.push({
        step: 'Test vote function',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // 4. Run the fix_all_product_vote_counts function to fix any existing issues
    try {
      const { data: fixAllResult, error: fixAllError } = await supabaseServer.rpc('fix_all_product_vote_counts');
      
      results.push({
        step: 'Fix all product vote counts',
        success: !fixAllError,
        error: fixAllError ? fixAllError.message : null,
        result: fixAllResult
      });
    } catch (error) {
      results.push({
        step: 'Fix all product vote counts',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    const success = results.every(r => r.success);
    
    return NextResponse.json({
      success,
      message: success 
        ? 'Vote system fixed successfully!' 
        : 'Vote system fix had errors, check the results',
      results
    });
  } catch (error) {
    console.error('Vote system fix error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// GET endpoint to check if the fix has been applied
export async function GET(request: NextRequest) {
  try {
    // Test if the vote_for_product function works
    const { data: testResult, error: testError } = await supabaseServer.rpc('vote_for_product', {
      p_product_id: '00000000-0000-0000-0000-000000000001', // Random test ID
      p_vote_type: 1,
      p_client_id: 'api-test-check'
    });
    
    // Get a random product to test with
    const { data: product, error: productError } = await supabaseServer
      .from('products')
      .select('id, name, upvotes, downvotes')
      .limit(1)
      .single();
    
    return NextResponse.json({
      isFixed: !testError,
      functionTest: {
        success: !testError,
        error: testError ? testError.message : null,
        result: testResult
      },
      productTest: {
        success: !productError,
        product: product ? {
          id: product.id,
          name: product.name,
          upvotes: Number(product.upvotes) || 0,
          downvotes: Number(product.downvotes) || 0,
          score: (Number(product.upvotes) || 0) - (Number(product.downvotes) || 0)
        } : null,
        error: productError ? productError.message : null
      }
    });
  } catch (error) {
    console.error('Vote system check error:', error);
    return NextResponse.json({ 
      isFixed: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 