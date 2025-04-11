import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  console.log('Creating admin user...');
  
  // Check if admin user already exists
  const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
  
  if (existingAdmin.length > 0) {
    console.log('Admin user already exists.');
    
    // Update admin password if it exists
    await db.update(users)
      .set({
        password: await hashPassword('admin'),
        role: 'admin'
      })
      .where(eq(users.username, 'admin'));
    
    console.log('Admin password updated.');
  } else {
    // Create admin user
    await db.insert(users).values({
      username: 'admin',
      password: await hashPassword('admin'),
      companyName: 'System Administrator',
      role: 'admin',
      profileCompleteness: 100
    });
    
    console.log('Admin user created successfully.');
  }

  // Exit the process
  process.exit(0);
}

main().catch(e => {
  console.error('Error creating admin user:', e);
  process.exit(1);
});