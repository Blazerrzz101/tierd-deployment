#!/usr/bin/env node

/**
 * Script to initialize Supabase database tables.
 * Requires SUPABASE_URL and SUPABASE_KEY environment variables.
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Validate environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Note: requires service role key to create tables

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.');
  console.error('Make sure you have a .env or .env.local file with these variables.');
  process.exit(1);
}

// Create Supabase client with admin rights
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Read SQL files
const userTablesSQL = fs.readFileSync(
  path.resolve(__dirname, '../lib/supabase/init-user-tables.sql'),
  'utf8'
);

async function initializeDatabase() {
  console.log('🔧 Initializing Supabase database tables...');
  
  try {
    // Execute SQL to create user tables
    console.log('Creating user tables and functions...');
    const { error: userTablesError } = await supabase.rpc('pgexec', { query: userTablesSQL });
    
    if (userTablesError) {
      console.error('Error creating user tables:', userTablesError);
      console.log('\nTrying alternative method...');
      
      // Split SQL into separate statements and execute sequentially
      const statements = userTablesSQL
        .split(';')
        .map(statement => statement.trim())
        .filter(statement => statement.length > 0);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('pgexec', { query: statement });
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          // Continue anyway to try other statements
        }
      }
    }

    console.log('✅ Database initialization completed.');
    console.log('\nNext steps:');
    console.log('1. Restart your Next.js application');
    console.log('2. Try signing up and creating a profile');
    
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase(); 