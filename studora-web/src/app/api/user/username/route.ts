import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await req.json();

    if (!username || typeof username !== "string" || username.length < 3) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    // Check if username is taken
    const existingUser = await db.select().from(user).where(eq(user.username, username));

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    // Update user
    await db.update(user).set({ username }).where(eq(user.id, session.user.id));

    return NextResponse.json({ success: true, username });
  } catch (error) {
    console.error("Error claiming username:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
