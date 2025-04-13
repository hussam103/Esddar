/**
 * This script updates the existing tenders table with the new fields
 * needed for the Simple Semantic Search integration.
 */

import { pool, db } from '../server/db';
import { sql } from 'drizzle-orm';
import { log } from '../server/vite';

async function main() {
  try {
    log('Starting schema update for tenders table...', 'schema-update');

    // Check if each column exists before trying to add it
    // This prevents errors when columns already exist
    
    // Add value column
    await addColumnIfNotExists('tenders', 'value', 'NUMERIC');
    
    // Add releaseDate column
    await addColumnIfNotExists('tenders', 'release_date', 'TIMESTAMP');
    
    // Add enrollmentDeadline column
    await addColumnIfNotExists('tenders', 'enrollment_deadline', 'TIMESTAMP');
    
    // Add closingDate column
    await addColumnIfNotExists('tenders', 'closing_date', 'TIMESTAMP');
    
    // Add industry column with default
    await addColumnIfNotExists('tenders', 'industry', 'TEXT', "'General'");
    
    // Add keywords array column
    await addColumnIfNotExists('tenders', 'keywords', 'TEXT[]', 'ARRAY[]::TEXT[]');
    
    // Add externalSource column with default
    await addColumnIfNotExists('tenders', 'external_source', 'TEXT', "'local'");
    
    // Add externalUrl column
    await addColumnIfNotExists('tenders', 'external_url', 'TEXT');
    
    // Add rawData column
    await addColumnIfNotExists('tenders', 'raw_data', 'TEXT');
    
    // Add matchScore column
    await addColumnIfNotExists('tenders', 'match_score', 'NUMERIC');

    log('Schema update completed successfully!', 'schema-update');
  } catch (error: any) {
    log(`Error updating schema: ${error.message}`, 'schema-update');
    throw error;
  } finally {
    await pool.end();
  }
}

async function addColumnIfNotExists(
  table: string,
  column: string,
  type: string,
  defaultValue?: string
): Promise<void> {
  try {
    // Check if column exists
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 AND column_name = $2
    `, [table, column]);

    if (result.rows.length === 0) {
      // Column doesn't exist, add it
      let query = `ALTER TABLE ${table} ADD COLUMN ${column} ${type}`;
      
      if (defaultValue) {
        query += ` DEFAULT ${defaultValue}`;
      }
      
      await pool.query(query);
      log(`Added ${column} column to ${table} table`, 'schema-update');
    } else {
      log(`Column ${column} already exists in ${table} table, skipping`, 'schema-update');
    }
  } catch (error: any) {
    log(`Error adding column ${column} to ${table}: ${error.message}`, 'schema-update');
    throw error;
  }
}

// Run the script
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to update schema:', error);
    process.exit(1);
  });