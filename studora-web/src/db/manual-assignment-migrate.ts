import { config } from "dotenv";
config({ path: ".env.local" });
import { sql } from "drizzle-orm";

async function run() {
  try {
    const { db } = await import("./index");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "assignment_room" (
          "id" text PRIMARY KEY NOT NULL,
          "name" text NOT NULL,
          "description" text,
          "invite_code" text NOT NULL UNIQUE,
          "owner_id" text NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "assignment_room_member" (
          "room_id" text NOT NULL,
          "user_id" text NOT NULL,
          "role" "role" DEFAULT 'viewer' NOT NULL,
          "joined_at" timestamp DEFAULT now() NOT NULL,
          CONSTRAINT "assignment_room_member_room_id_user_id_pk" PRIMARY KEY("room_id","user_id")
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "assignment" (
          "id" text PRIMARY KEY NOT NULL,
          "room_id" text NOT NULL,
          "title" text NOT NULL,
          "description" text,
          "file_url" text NOT NULL,
          "file_name" text NOT NULL,
          "deadline" timestamp NOT NULL,
          "created_by" text NOT NULL,
          "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "assignment_submission" (
          "id" text PRIMARY KEY NOT NULL,
          "assignment_id" text NOT NULL,
          "user_id" text NOT NULL,
          "file_url" text NOT NULL,
          "file_name" text NOT NULL,
          "submitted_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("Tables created.");

    await db.execute(sql`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_room_owner_id_user_id_fk') THEN
              ALTER TABLE "assignment_room" ADD CONSTRAINT "assignment_room_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_room_member_room_id_assignment_room_id_fk') THEN
              ALTER TABLE "assignment_room_member" ADD CONSTRAINT "assignment_room_member_room_id_assignment_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."assignment_room"("id") ON DELETE cascade ON UPDATE no action;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_room_member_user_id_user_id_fk') THEN
              ALTER TABLE "assignment_room_member" ADD CONSTRAINT "assignment_room_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_room_id_assignment_room_id_fk') THEN
              ALTER TABLE "assignment" ADD CONSTRAINT "assignment_room_id_assignment_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."assignment_room"("id") ON DELETE cascade ON UPDATE no action;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_created_by_user_id_fk') THEN
              ALTER TABLE "assignment" ADD CONSTRAINT "assignment_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
          END IF;

          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_submission_assignment_id_assignment_id_fk') THEN
              ALTER TABLE "assignment_submission" ADD CONSTRAINT "assignment_submission_assignment_id_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignment"("id") ON DELETE cascade ON UPDATE no action;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assignment_submission_user_id_user_id_fk') THEN
              ALTER TABLE "assignment_submission" ADD CONSTRAINT "assignment_submission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
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
