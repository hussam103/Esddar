import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * This script handles schema changes carefully by:
 * 1. Adding new columns to existing tables
 * 2. Creating new tables
 * 3. NOT dropping any existing columns to preserve data
 */
async function main() {
  console.log("Applying schema changes...");
  
  try {
    // Add email column to users table if it doesn't exist
    await db.execute(sql`
      ALTER TABLE IF EXISTS users 
      ADD COLUMN IF NOT EXISTS email TEXT;
    `);
    console.log("Added email column to users table");
    
    // Add emailVerified column to users table if it doesn't exist
    await db.execute(sql`
      ALTER TABLE IF EXISTS users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
    `);
    console.log("Added email_verified column to users table");
    
    // Add onboarding step tracking
    await db.execute(sql`
      ALTER TABLE IF EXISTS users 
      ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'email_verification';
    `);
    console.log("Added onboarding_step column to users table");
    
    // Add onboarding completion flag
    await db.execute(sql`
      ALTER TABLE IF EXISTS users 
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
    `);
    console.log("Added onboarding_completed column to users table");
    
    // Add tutorial flag
    await db.execute(sql`
      ALTER TABLE IF EXISTS users 
      ADD COLUMN IF NOT EXISTS has_seen_tutorial BOOLEAN DEFAULT FALSE;
    `);
    console.log("Added has_seen_tutorial column to users table");
    
    console.log("Schema changes applied successfully!");
  } catch (error) {
    console.error("Error applying schema changes:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();