"use server";

import { db } from "@/db";
import { whiteboard } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

export async function getWhiteboard(fileUrl: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return { error: "Unauthorized", success: false };
    }

    const data = await db
      .select()
      .from(whiteboard)
      .where(
        and(
          eq(whiteboard.userId, session.user.id),
          eq(whiteboard.fileUrl, fileUrl)
        )
      );

    if (data.length > 0) {
      return { success: true, canvasData: data[0].canvasData };
    }

    return { success: true, canvasData: null };
  } catch (err: any) {
    console.error("Error getting whiteboard:", err);
    return { error: err.message, success: false };
  }
}

export async function saveWhiteboard(fileUrl: string, canvasData: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return { error: "Unauthorized", success: false };
    }

    await db
      .insert(whiteboard)
      .values({
        userId: session.user.id,
        fileUrl,
        canvasData,
      })
      .onConflictDoUpdate({
        target: [whiteboard.userId, whiteboard.fileUrl],
        set: {
          canvasData,
          updatedAt: new Date(),
        },
      });

    return { success: true };
  } catch (err: any) {
    console.error("Error saving whiteboard:", err);
    return { error: err.message, success: false };
  }
}

export async function clearWhiteboard(fileUrl: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return { error: "Unauthorized", success: false };
    }

    await db
      .delete(whiteboard)
      .where(
        and(
          eq(whiteboard.userId, session.user.id),
          eq(whiteboard.fileUrl, fileUrl)
        )
      );

    return { success: true };
  } catch (err: any) {
    console.error("Error clearing whiteboard:", err);
    return { error: err.message, success: false };
  }
}
