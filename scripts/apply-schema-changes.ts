import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * This script handles schema changes carefully by:
 * 1. Adding new columns to existing tables
 * 2. Creating new tables
 * 3. NOT dropping any existing columns to preserve data
 */
async function main() {
  console.log("Starting schema migration...");
  
  try {
    console.log("Adding new columns to existing tables...");
    
    // Add new columns to Users table
    await db.execute(sql`
      ALTER TABLE IF EXISTS users 
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
    `);
    console.log("✓ Added columns to users table");
    
    // Add new columns to Tenders table
    await db.execute(sql`
      ALTER TABLE IF EXISTS tenders 
      ADD COLUMN IF NOT EXISTS external_id TEXT,
      ADD COLUMN IF NOT EXISTS vector_id TEXT,
      ADD COLUMN IF NOT EXISTS vector_status TEXT DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS url TEXT;
    `);
    console.log("✓ Added columns to tenders table");
    
    // Add new columns to Applications table
    await db.execute(sql`
      ALTER TABLE IF EXISTS applications 
      ADD COLUMN IF NOT EXISTS match_score INTEGER;
    `);
    console.log("✓ Added columns to applications table");
    
    // Add new columns to UserProfiles table
    await db.execute(sql`
      ALTER TABLE IF EXISTS user_profiles 
      ADD COLUMN IF NOT EXISTS company_description TEXT,
      ADD COLUMN IF NOT EXISTS skills TEXT,
      ADD COLUMN IF NOT EXISTS past_experience TEXT,
      ADD COLUMN IF NOT EXISTS preferred_sectors TEXT[],
      ADD COLUMN IF NOT EXISTS company_size TEXT,
      ADD COLUMN IF NOT EXISTS years_in_business INTEGER,
      ADD COLUMN IF NOT EXISTS vector_id TEXT,
      ADD COLUMN IF NOT EXISTS vector_status TEXT DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);
    console.log("✓ Added columns to user_profiles table");
    
    // Create new tables
    console.log("Creating new tables...");
    
    // Company Documents
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS company_documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        document_type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        extracted_text TEXT,
        meta_data JSONB,
        processing_status TEXT DEFAULT 'pending',
        uploaded_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✓ Created company_documents table");
    
    // External Sources
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS external_sources (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        url TEXT NOT NULL,
        type TEXT NOT NULL,
        api_endpoint TEXT,
        credentials JSONB,
        active BOOLEAN DEFAULT TRUE,
        last_scraped_at TIMESTAMP,
        scraping_frequency INTEGER DEFAULT 24,
        created_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER NOT NULL REFERENCES users(id)
      );
    `);
    console.log("✓ Created external_sources table");
    
    // Scrape Logs
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS scrape_logs (
        id SERIAL PRIMARY KEY,
        source_id INTEGER NOT NULL REFERENCES external_sources(id) ON DELETE CASCADE,
        start_time TIMESTAMP DEFAULT NOW(),
        end_time TIMESTAMP,
        status TEXT DEFAULT 'running',
        total_tenders INTEGER DEFAULT 0,
        new_tenders INTEGER DEFAULT 0,
        updated_tenders INTEGER DEFAULT 0,
        failed_tenders INTEGER DEFAULT 0,
        error_message TEXT,
        details JSONB
      );
    `);
    console.log("✓ Created scrape_logs table");
    
    // Tender Matches
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tender_matches (
        id SERIAL PRIMARY KEY,
        tender_id INTEGER NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
        user_profile_id INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
        match_score INTEGER NOT NULL,
        match_details JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        notification_sent BOOLEAN DEFAULT FALSE
      );
    `);
    console.log("✓ Created tender_matches table");
    
    // Vector Records
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS vector_records (
        id SERIAL PRIMARY KEY,
        external_id TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_id INTEGER NOT NULL,
        embedding_model TEXT NOT NULL,
        dimensions INTEGER NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✓ Created vector_records table");
    
    console.log("Schema migration completed successfully!");
  } catch (error) {
    console.error("Error applying schema changes:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();