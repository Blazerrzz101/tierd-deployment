#!/usr/bin/env node

// Script to apply a specific database migration directly
// This is for emergency fixes when regular migrations aren't working

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

// Create Supabase client with service role key
console.log('Creating Supabase client...');
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

async function main() {
  try {
    console.log('Starting migration application...');
    
    // Read SQL migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250226000000_fix_vote_function_signature.sql');
    console.log(`Reading migration file: ${migrationPath}`);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Apply SQL directly
    console.log('Applying migration...');
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_command: sql });
      
      if (error) {
        throw new Error(`Error executing SQL: ${error.message}`);
      }
      
      console.log('Migration applied successfully!');
    } catch (error) {
      console.error('Error applying migration using exec_sql:', error.message);
      console.log('Trying fallback approach...');
      
      try {
        // If exec_sql fails, try with direct_sql_exec
        const { data, error } = await supabase.rpc('direct_sql_exec', { sql_script: sql });
        
        if (error) {
          throw new Error(`Error executing SQL with direct_sql_exec: ${error.message}`);
        }
        
        console.log('Migration applied successfully using direct_sql_exec!');
        console.log('Result:', data);
      } catch (fallbackError) {
        console.error('Fallback approach failed:', fallbackError.message);
        console.log('Executing each statement separately...');
        
        // Split the SQL and run each statement
        const statements = sql.split(';');
        let success = 0;
        let failure = 0;
        
        for (const statement of statements) {
          const trimmed = statement.trim();
          if (trimmed.length > 5) {
            try {
              await supabase.rpc('exec_sql', { sql_command: trimmed + ';' });
              success++;
            } catch (e) {
              console.error(`Error executing statement: ${trimmed.substring(0, 50)}...`);
              failure++;
            }
          }
        }
        
        console.log(`Executed ${success} statements successfully, ${failure} failed.`);
      }
    }
    
    // Test the function after applying migration
    console.log('Testing vote_for_product function...');
    const testId = 'ffffffff-ffff-ffff-ffff-ffffffffffff'; // Dummy ID for testing
    
    const { data: voteResult, error: voteError } = await supabase.rpc('vote_for_product', {
      p_product_id: testId,
      p_vote_type: 1,
      p_client_id: 'migration-test-client'
    });
    
    if (voteError) {
      console.error('Error testing vote_for_product function:', voteError.message);
    } else {
      console.log('vote_for_product function test successful:');
      console.log(voteResult);
    }
    
    // Also apply the fix all function
    const fixAllMigrationPath = path.join(__dirname, '../supabase/migrations/20250226000002_add_fix_all_votes_function.sql');
    console.log(`Reading fix all function: ${fixAllMigrationPath}`);
    
    try {
      const fixAllSql = fs.readFileSync(fixAllMigrationPath, 'utf8');
      const { data, error } = await supabase.rpc('direct_sql_exec', { sql_script: fixAllSql });
      
      if (error) {
        console.error('Error applying fix_all_product_vote_counts function:', error.message);
      } else {
        console.log('fix_all_product_vote_counts function applied successfully!');
        
        // Test the fix all function
        console.log('Testing fix_all_product_vote_counts function...');
        
        const { data: fixResult, error: fixError } = await supabase.rpc('fix_all_product_vote_counts');
        
        if (fixError) {
          console.error('Error testing fix_all_product_vote_counts function:', fixError.message);
        } else {
          console.log('fix_all_product_vote_counts test successful:');
          console.log(`Fixed ${fixResult.fixed_products} products out of ${fixResult.total_products} total`);
        }
      }
    } catch (e) {
      console.error('Error reading or applying fix_all_product_vote_counts function:', e.message);
    }
    
    console.log('Migration process completed!');
  } catch (error) {
    console.error('Error in migration process:', error.message);
    process.exit(1);
  }
}

// Run the main function
main()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 