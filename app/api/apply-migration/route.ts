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
    // In production, you should add proper authentication
    const body = await request.json();
    const { authToken } = body;
    
    // For production, validate admin token (implement proper auth)
    if (process.env.NODE_ENV === 'production' && authToken !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const results = [];
    
    // Apply the SQL exec helper functions if needed
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
    
    // Apply the vote function migrations
    try {
      const voteFunctionPath = path.join(process.cwd(), 'supabase/migrations/20250226000000_fix_vote_function_signature.sql');
      const voteFunctionSql = fs.readFileSync(voteFunctionPath, 'utf8');
      
      const { error: voteError } = await supabaseServer.rpc('exec_sql', { 
        sql: voteFunctionSql 
      });
      
      results.push({
        step: 'Fix vote function signature',
        success: !voteError,
        error: voteError ? voteError.message : null
      });
    } catch (error) {
      results.push({
        step: 'Fix vote function signature',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Apply the remaining votes function migrations
    try {
      const remainingVotesPath = path.join(process.cwd(), 'supabase/migrations/20250305000000_add_get_remaining_votes_function.sql');
      const remainingVotesSql = fs.readFileSync(remainingVotesPath, 'utf8');
      
      const { error: remainingVotesError } = await supabaseServer.rpc('exec_sql', { 
        sql: remainingVotesSql 
      });
      
      results.push({
        step: 'Add remaining votes function',
        success: !remainingVotesError,
        error: remainingVotesError ? remainingVotesError.message : null
      });
    } catch (error) {
      results.push({
        step: 'Add remaining votes function',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Test the vote function
    try {
      const testProductId = '00000000-0000-0000-0000-000000000001';
      const testClientId = 'test-client-migration-check';
      
      const { data: testResult, error: testError } = await supabaseServer.rpc('vote_for_product', {
        p_product_id: testProductId,
        p_vote_type: 1,
        p_client_id: testClientId
      });
      
      results.push({
        step: 'Test vote function',
        success: !testError,
        data: testResult,
        error: testError ? testError.message : null
      });
    } catch (error) {
      results.push({
        step: 'Test vote function',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    return NextResponse.json({
      success: results.every(r => r.success),
      results
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to apply migrations',
    timestamp: new Date().toISOString()
  });
} 