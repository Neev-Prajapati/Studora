import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const runPatch = async () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

  const sql = postgres(process.env.DATABASE_URL, { max: 1 });

  try {
    console.log("Creating new tables...");
    
    await sql`
      DO $$ BEGIN
        CREATE TYPE "public"."role" AS ENUM('owner', 'editor', 'viewer');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "room" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "description" text,
        "invite_code" text NOT NULL UNIQUE,
        "owner_id" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "room_member" (
        "room_id" text NOT NULL,
        "user_id" text NOT NULL,
        "role" "role" DEFAULT 'viewer' NOT NULL,
        "joined_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "room_member_room_id_user_id_pk" PRIMARY KEY("room_id","user_id")
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "file" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "url" text NOT NULL,
        "room_id" text NOT NULL,
        "uploaded_by" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;

    console.log("Adding foreign keys...");
    
    await sql`
      DO $$ BEGIN
        ALTER TABLE "file" ADD CONSTRAINT "file_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;
    await sql`
      DO $$ BEGIN
        ALTER TABLE "file" ADD CONSTRAINT "file_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id");
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;
    await sql`
      DO $$ BEGIN
        ALTER TABLE "room" ADD CONSTRAINT "room_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id");
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;
    await sql`
      DO $$ BEGIN
        ALTER TABLE "room_member" ADD CONSTRAINT "room_member_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;
    await sql`
      DO $$ BEGIN
        ALTER TABLE "room_member" ADD CONSTRAINT "room_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;

    console.log("Patch applied successfully!");
  } catch (err) {
    console.error("Patch failed:", err);
  } finally {
    await sql.end();
  }
};

runPatch();
