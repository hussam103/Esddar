import { db } from '../server/db';
import { sql } from 'drizzle-orm';

/**
 * This script adds the queryData column to the user_profiles table.
 * It should be run after deploying the updated schema.
 */

async function updateUserProfilesTable() {
  console.log('Starting user_profiles table update...');
  
  try {
    // Check if the column already exists
    const checkResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'query_data'
      );
    `);
    
    const columnExists = checkResult.rows[0].exists;
    
    if (columnExists) {
      console.log('Column "query_data" already exists in user_profiles table.');
      return;
    }
    
    // Add the query_data column
    await db.execute(sql`
      ALTER TABLE user_profiles
      ADD COLUMN query_data TEXT;
    `);
    
    console.log('Successfully added query_data column to user_profiles table.');
  } catch (error) {
    console.error('Error updating user_profiles table:', error);
    throw error;
  }
}

async function main() {
  try {
    await updateUserProfilesTable();
    console.log('User profiles table update completed successfully!');
  } catch (error) {
    console.error('Error updating user profiles table:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();