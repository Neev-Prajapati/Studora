import { config } from "dotenv";
config({ path: ".env.local" });
import { sql } from "drizzle-orm";

async function run() {
  try {
    const { db } = await import("./index");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "assignment_activity_log" (
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

    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_activity_log_room_id_assignment_room_id_fk') THEN
              ALTER TABLE "assignment_activity_log" ADD CONSTRAINT "assignment_activity_log_room_id_assignment_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."assignment_room"("id") ON DELETE cascade ON UPDATE no action;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_activity_log_user_id_user_id_fk') THEN
              ALTER TABLE "assignment_activity_log" ADD CONSTRAINT "assignment_activity_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
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
