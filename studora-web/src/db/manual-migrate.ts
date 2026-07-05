import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "./index";
import { sql } from "drizzle-orm";

async function run() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "activity_log" (
          "id" text PRIMARY KEY NOT NULL,
          "room_id" text NOT NULL,
          "room_name" text NOT NULL,
          "user_id" text NOT NULL,
          "action" text NOT NULL,
          "target" text,
          "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("Table created.");

    // Add foreign keys separately to handle "already exists" gracefully if needed, 
    // but this is a one-time script for this table.
    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_log_room_id_room_id_fk') THEN
              ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_log_user_id_user_id_fk') THEN
              ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
          END IF;
      END
      $$;
    `);
    console.log("Foreign keys added. Migration complete.");
  } catch (error) {
    console.error("Migration failed:", error);
  }
  process.exit(0);
}

run();
