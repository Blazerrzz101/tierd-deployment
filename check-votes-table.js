// Script to check the structure of the votes table in Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkVotesTableStructure() {
  console.log('Checking votes table structure...');
  console.log(`Using Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  
  try {
    // Get the metadata for the votes table
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?table=votes`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );
    
    const result = await response.json();
    console.log('Table structure information:');
    console.log(JSON.stringify(result, null, 2));
    
    // Try to add a metadata column if it doesn't exist
    console.log('\nAttempting to fetch a row from votes table to see actual columns...');
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error fetching votes:', error);
    } else {
      console.log('Sample vote record:');
      console.log(JSON.stringify(data, null, 2));
      
      // List the actual columns in the first row
      if (data && data.length > 0) {
        console.log('\nExisting columns in votes table:');
        Object.keys(data[0]).forEach(column => {
          console.log(`- ${column}`);
        });
      } else {
        console.log('No records found in votes table');
      }
    }
  } catch (error) {
    console.error('Error checking votes table structure:', error);
  }
}

// Run the check
checkVotesTableStructure().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 