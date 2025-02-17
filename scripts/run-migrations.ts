import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { Client } from 'pg'

// Load environment variables from .env.local if it exists
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' })
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('Missing DATABASE_URL environment variable')
  process.exit(1)
}

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = []
  let currentStatement = ''
  let inDollarQuote = false
  let dollarTag = ''
  let i = 0

  while (i < sql.length) {
    // Check for dollar quote start
    if (sql[i] === '$' && !inDollarQuote) {
      let j = i + 1
      let tag = ''
      while (j < sql.length && sql[j] !== '$' && /[\w_]/.test(sql[j])) {
        tag += sql[j]
        j++
      }
      if (j < sql.length && sql[j] === '$') {
        inDollarQuote = true
        dollarTag = tag
        currentStatement += sql.slice(i, j + 1)
        i = j + 1
        continue
      }
    }
    // Check for dollar quote end
    else if (sql[i] === '$' && inDollarQuote) {
      let j = i + 1
      let tag = ''
      while (j < sql.length && sql[j] !== '$' && /[\w_]/.test(sql[j])) {
        tag += sql[j]
        j++
      }
      if (j < sql.length && sql[j] === '$' && tag === dollarTag) {
        inDollarQuote = false
        dollarTag = ''
        currentStatement += sql.slice(i, j + 1)
        i = j + 1
        continue
      }
    }
    // Check for statement end
    else if (sql[i] === ';' && !inDollarQuote) {
      currentStatement += ';'
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim())
      }
      currentStatement = ''
      i++
      continue
    }

    currentStatement += sql[i]
    i++
  }

  // Add the last statement if it exists
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim())
  }

  return statements
}

async function runMigration(sql: string) {
  const client = new Client({ connectionString: databaseUrl })
  
  try {
    await client.connect()
    // Split the SQL file into individual statements
    const statements = splitSqlStatements(sql)

    for (const statement of statements) {
      try {
        console.log('Executing statement:', statement)
        await client.query(statement)
        console.log('Statement executed successfully')
      } catch (error) {
        console.error('Error executing statement:', statement)
        console.error('Error details:', error)
        throw error
      }
    }
  } catch (error) {
    console.error('Error executing migration:', error)
    throw error
  } finally {
    await client.end()
  }
}

async function main() {
  try {
    const migrationsDir = path.join(__dirname, '../lib/supabase/migrations')
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()

    for (const file of files) {
      console.log(`Running migration: ${file}`)
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      await runMigration(sql)
      console.log(`Completed migration: ${file}`)
    }

    console.log('All migrations completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

main() 