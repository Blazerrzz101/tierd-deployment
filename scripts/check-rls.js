const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRlsPolicies() {
  console.log('Checking RLS policies...');
  
  try {
    // Check if RLS is enabled on the votes table
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('check_table_rls', { table_name: 'votes' });
      
    if (rlsError) {
      console.error('Error checking RLS:', rlsError);
      
      // Try a direct query instead
      console.log('Trying direct query to check RLS...');
      const { data: tableInfo, error: tableError } = await supabase
        .from('pg_tables')
        .select('*')
        .eq('tablename', 'votes')
        .single();
        
      if (tableError) {
        console.error('Error querying table info:', tableError);
      } else {
        console.log('Table info:', tableInfo);
      }
    } else {
      console.log('RLS status for votes table:', rlsData);
    }
    
    // Try to insert a test vote to check permissions
    console.log('Testing vote insertion...');
    const testProductId = '9dd2bfe2-6eef-40de-ae12-c35ff1975914';
    const testClientId = 'test-rls-check-' + Date.now();
    
    const { data: insertData, error: insertError } = await supabase
      .from('votes')
      .insert({
        product_id: testProductId,
        vote_type: 1,
        metadata: { client_id: testClientId }
      })
      .select();
      
    if (insertError) {
      console.error('Error inserting test vote:', insertError);
    } else {
      console.log('Successfully inserted test vote:', insertData);
      
      // Clean up the test vote
      const { error: deleteError } = await supabase
        .from('votes')
        .delete()
        .eq('id', insertData[0].id);
        
      if (deleteError) {
        console.error('Error deleting test vote:', deleteError);
      } else {
        console.log('Successfully deleted test vote');
      }
    }
    
    // Check if there's a function to handle votes
    console.log('Checking for vote functions...');
    const { data: functions, error: functionsError } = await supabase
      .rpc('get_function_info', { function_name: 'vote_for_product' });
      
    if (functionsError) {
      console.error('Error checking functions:', functionsError);
    } else {
      console.log('Function info:', functions);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkRlsPolicies()
  .then(() => console.log('RLS check completed'))
  .catch(err => console.error('Error in RLS check:', err)); 