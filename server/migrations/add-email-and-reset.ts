
import { db } from "../db";
import { sql } from "drizzle-orm";

export async function migrateAddEmailAndReset() {
  try {
    console.log("Adding email and reset token columns...");
    
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS reset_token TEXT,
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
    `);
    
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users(email)
    `);
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}
