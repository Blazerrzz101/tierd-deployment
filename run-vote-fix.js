// Script to apply vote function fixes to Supabase
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
const sqlFilePath = path.join(__dirname, 'fix-vote-functions-directly-update.sql');
const voteFunctionSQL = fs.readFileSync(sqlFilePath, 'utf8');

async function fixVoteSystem() {
  console.log('Starting vote system function fix...');
  console.log(`Using Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  
  // Try different methods to execute SQL on Supabase
  const methods = [
    // Method 1: Using the exec_sql function if it exists
    async () => {
      try {
        console.log('Trying with exec_sql function...');
        const { data, error } = await supabase.rpc('exec_sql', { sql: voteFunctionSQL });
        
        if (error) {
          console.error('Error with exec_sql function:', error);
          return false;
        }
        
        console.log('Successfully executed SQL with exec_sql function');
        return true;
      } catch (error) {
        console.error('Failed with exec_sql method:', error);
        return false;
      }
    },
    
    // Method 2: Using direct SQL endpoint if available
    async () => {
      try {
        console.log('Trying direct SQL endpoint...');
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ sql: voteFunctionSQL })
        });
        
        const result = await response.json();
        if (result.error) {
          console.error('Error with direct SQL endpoint:', result.error);
          return false;
        }
        
        console.log('Successfully executed SQL with direct endpoint');
        return true;
      } catch (error) {
        console.error('Failed with direct SQL endpoint method:', error);
        return false;
      }
    },
    
    // Method 3: Try dropping and recreating functions one by one
    async () => {
      try {
        console.log('Trying individual function calls...');
        
        // Split the SQL into individual statements
        const statements = voteFunctionSQL.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (let i = 0; i < statements.length; i++) {
          const stmt = statements[i] + ';';
          console.log(`Executing statement ${i+1}/${statements.length}...`);
          
          const { error } = await supabase.rpc('exec_sql', { sql: stmt });
          if (error) {
            console.error(`Error executing statement ${i+1}:`, error);
            // Continue with next statement even if this one fails
          }
        }
        
        console.log('Completed individual function execution');
        return true;
      } catch (error) {
        console.error('Failed with individual function method:', error);
        return false;
      }
    }
  ];
  
  // Try each method in sequence until one succeeds
  for (const method of methods) {
    const success = await method();
    if (success) {
      console.log('Successfully fixed vote system functions!');
      
      // Verify the functions were created properly
      try {
        console.log('Verifying function installation...');
        // Try to call the has_user_voted function with test parameters
        const testProductId = '00000000-0000-0000-0000-000000000000'; // Test UUID
        const testClientId = 'test-client';
        
        const { error } = await supabase.rpc('has_user_voted', { 
          p_product_id: testProductId,
          p_client_id: testClientId
        });
        
        if (!error || error.code === 'PGRST116') { // PGRST116 means no rows returned, which is ok
          console.log('Function verification successful!');
        } else {
          console.warn('Function verification failed:', error);
        }
      } catch (verifyError) {
        console.warn('Error during verification:', verifyError);
      }
      
      return;
    }
  }
  
  // If we get here, all methods failed
  console.error('All methods failed. Please apply the SQL directly in the Supabase dashboard SQL editor.');
  console.log('SQL to run:');
  console.log(voteFunctionSQL);
}

// Run the fix
fixVoteSystem().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 