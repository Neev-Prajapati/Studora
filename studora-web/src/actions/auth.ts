"use server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Looks up the email address associated with a given username.
 * Used to allow users to log in with their username.
 */
export async function lookupEmailByUsername(usernameStr: string): Promise<string | null> {
  if (!usernameStr) return null;

  try {
    const foundUser = await db.query.user.findFirst({
      where: eq(user.username, usernameStr),
      columns: {
        email: true,
      },
    });

    return foundUser?.email || null;
  } catch (error) {
    console.error("Error looking up email by username:", error);
    return null;
  }
}
