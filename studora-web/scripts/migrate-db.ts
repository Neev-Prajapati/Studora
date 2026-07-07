import { loadEnvConfig } from '@next/env';
import postgres from 'postgres';
import fs from 'fs';

loadEnvConfig(process.cwd());

async function run() {
  try {
    const connectionString = process.env.DATABASE_URL!;
    const sql = postgres(connectionString, { prepare: false });
    const migration = fs.readFileSync('supabase/migrations/0003_majestic_komodo.sql', 'utf8');
    
    // Split on statements or just run it as unsafe
    await sql.unsafe(migration.replace(/--> statement-breakpoint/g, ';'));
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}
run();
