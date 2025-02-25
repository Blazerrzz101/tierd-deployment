const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create a Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('Applying migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20240225_add_votes_rls.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Execute the SQL statement
        const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          console.log('Statement:', stmt);
          
          // Try alternative approach
          console.log('Trying alternative approach...');
          const { error: directError } = await supabase.auth.admin.executeSql(stmt);
          
          if (directError) {
            console.error('Alternative approach also failed:', directError);
          } else {
            console.log('Alternative approach succeeded');
          }
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (stmtError) {
        console.error(`Error executing statement ${i + 1}:`, stmtError);
        console.log('Statement:', stmt);
      }
    }
    
    console.log('Migration completed');
  } catch (error) {
    console.error('Error applying migration:', error);
  }
}

applyMigration()
  .then(() => console.log('Done'))
  .catch(err => console.error('Unexpected error:', err)); 