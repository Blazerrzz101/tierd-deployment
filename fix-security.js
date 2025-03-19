// Script to apply RLS (Row Level Security) fixes to Supabase tables
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'fix-rls-security.sql');
const securityFixSQL = fs.readFileSync(sqlFilePath, 'utf8');

async function fixSecurity() {
  console.log('Starting security fixes for RLS issues...');
  console.log(`Using Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  
  // Try to apply security fixes with direct SQL endpoint
  try {
    console.log('Applying RLS security fixes...');
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql: securityFixSQL })
    });
    
    const result = await response.json();
    
    if (result.error) {
      console.error('Error applying RLS security fixes:', result.error);
      
      // Try applying the statements one by one
      console.log('Trying to apply statements one by one...');
      const statements = securityFixSQL.split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0)
        .map(stmt => stmt + ';');
      
      let successCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        console.log(`Executing statement ${i+1}/${statements.length}...`);
        
        try {
          const stmtResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ sql: stmt })
          });
          
          const stmtResult = await stmtResponse.json();
          
          if (!stmtResult.error) {
            successCount++;
          } else {
            console.error(`Error executing statement ${i+1}:`, stmtResult.error);
          }
        } catch (stmtError) {
          console.error(`Exception executing statement ${i+1}:`, stmtError);
        }
      }
      
      console.log(`Applied ${successCount}/${statements.length} statements successfully`);
      
      if (successCount > 0) {
        console.log('Some security fixes were applied. Please check Supabase dashboard to verify.');
      } else {
        console.error('Failed to apply any security fixes.');
        console.log('Please apply the SQL directly in the Supabase dashboard SQL editor:');
        console.log(securityFixSQL);
      }
    } else {
      console.log('Successfully applied all RLS security fixes!');
    }
    
    // Verify RLS is enabled on the tables
    try {
      console.log('Verifying RLS status...');
      const { data, error } = await supabase.rpc('check_rls_enabled', {
        table_names: ['anonymous_votes', 'error_logs', 'votes']
      });
      
      if (error) {
        console.warn('Could not verify RLS status:', error);
      } else {
        console.log('RLS status verification:', data);
      }
    } catch (verifyError) {
      console.warn('Error verifying RLS status:', verifyError);
    }
  } catch (error) {
    console.error('Failed to apply security fixes:', error);
    console.log('Please apply the SQL directly in the Supabase dashboard SQL editor:');
    console.log(securityFixSQL);
  }
}

// Run the security fix
fixSecurity().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 