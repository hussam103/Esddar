import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema';

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });

  console.log('Running migrations...');
  
  // This will automatically create the tables based on your schema
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      company_name TEXT NOT NULL,
      industry TEXT,
      description TEXT,
      services TEXT[],
      profile_completeness INTEGER DEFAULT 0,
      subscription_plan TEXT,
      subscription_price NUMERIC,
      subscription_status TEXT,
      subscription_start_date TIMESTAMP,
      subscription_end_date TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tenders (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      agency TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      value_min NUMERIC,
      value_max NUMERIC,
      deadline TIMESTAMP NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      requirements TEXT,
      bid_number TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_tenders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      tender_id INTEGER NOT NULL,
      saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      tender_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      submitted_at TIMESTAMP,
      proposal_content TEXT,
      documents JSONB
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE,
      match_accuracy INTEGER DEFAULT 0,
      tenders_found INTEGER DEFAULT 0,
      proposals_submitted INTEGER DEFAULT 0,
      success_rate INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS "session" (
      sid VARCHAR NOT NULL PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    );
  `);

  console.log('Migrations completed successfully!');
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});