import 'dotenv/config';
import { createApp } from "./app";
import { log } from "./vite";
import { db } from './db';
import { sql } from 'drizzle-orm';
import { spawn } from 'child_process';

async function initializeDatabase() {
  try {
    // Check if users table exists
    await db.execute(sql`SELECT 1 FROM users LIMIT 1`);
    console.log('✓ Database schema already exists');
  } catch (error) {
    console.log('⚠ Database schema not found, initializing...');

    return new Promise((resolve, reject) => {
      const drizzle = spawn('npx', ['drizzle-kit', 'push'], {
        stdio: 'inherit',
        shell: true
      });

      drizzle.on('close', (code) => {
        if (code === 0) {
          console.log('✓ Database schema initialized successfully');
          resolve(true);
        } else {
          reject(new Error(`Database initialization failed with code ${code}`));
        }
      });

      drizzle.on('error', (err) => {
        reject(err);
      });
    });
  }
}

(async () => {
  // Initialize database if needed
  await initializeDatabase();

  const { server } = await createApp();

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();