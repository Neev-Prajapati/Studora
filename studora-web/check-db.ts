import { db } from "./src/db/index.ts";
import { user } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";

async function run() {
  try {
    const users = await db.select().from(user).limit(1);
    console.log("Users:", users);
  } catch (error: any) {
    console.error("DB Error:", error.message);
  }
  process.exit(0);
}

run();
