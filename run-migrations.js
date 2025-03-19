// Script to run migrations to fix vote function issues
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runDirectSql(sql) {
  try {
    // Execute SQL directly without the exec_sql function
    const { error } = await supabase.from('_dummy_query').rpc('exec_direct_sql', { 
      sql_string: sql 
    });
    
    if (error) {
      console.error('Error executing SQL directly:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error running direct SQL:', error);
    return false;
  }
}

async function runExecSql(sql) {
  try {
    // Execute SQL using the exec_sql function
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error executing SQL with exec_sql:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error with exec_sql function:', error);
    return false;
  }
}

async function runMigrations() {
  console.log('Starting migrations...');
  
  // First, read the SQL files
  const execSqlMigration = fs.readFileSync(
    path.join(__dirname, 'supabase/migrations/20240330000000_add_exec_sql_function.sql'),
    'utf8'
  );
  
  const fixVoteFunctionMigration = fs.readFileSync(
    path.join(__dirname, 'supabase/migrations/20250226000000_fix_vote_function_signature.sql'),
    'utf8'
  );
  
  // First try to check if exec_sql function already exists
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1;' });
    
    if (!error) {
      console.log('exec_sql function already exists, skipping creation.');
    } else {
      // If exec_sql doesn't exist, we need to create it first
      console.log('Creating exec_sql function...');
      const success = await runDirectSql(execSqlMigration);
      
      if (!success) {
        console.error('Failed to create exec_sql function.');
        return false;
      }
      
      console.log('exec_sql function created successfully.');
    }
  } catch (error) {
    // Function likely doesn't exist, create it directly
    console.log('exec_sql function not found, creating it...');
    const success = await runDirectSql(execSqlMigration);
    
    if (!success) {
      console.error('Failed to create exec_sql function.');
      return false;
    }
    
    console.log('exec_sql function created successfully.');
  }
  
  // Now run the vote function fix
  console.log('Fixing vote functions...');
  const voteFunctionSuccess = await runExecSql(fixVoteFunctionMigration);
  
  if (!voteFunctionSuccess) {
    console.error('Failed to fix vote functions.');
    return false;
  }
  
  console.log('Vote functions fixed successfully.');
  return true;
}

// Run the migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(success => {
      if (success) {
        console.log('All migrations completed successfully.');
        process.exit(0);
      } else {
        console.error('Migration process failed.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations }; 