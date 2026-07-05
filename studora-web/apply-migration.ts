import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";

const connectionString = "postgresql://postgres.nwcfaycykbjevmauzbzv:L%23A42d3EJyM4G5%23@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";
const client = postgres(connectionString);
const db = drizzle(client);

async function run() {
  try {
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN "email_reminders" boolean DEFAULT true NOT NULL;`);
    console.log("Added email_reminders");
  } catch(e: any) {
    console.error("email_reminders:", e);
  }
  
  try {
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN "email_room_activity" boolean DEFAULT true NOT NULL;`);
    console.log("Added email_room_activity");
  } catch(e: any) {
    console.error("email_room_activity:", e);
  }
  process.exit(0);
}

run();
