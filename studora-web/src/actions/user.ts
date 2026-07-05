"use server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updateUsernameAction(newUsername: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    // Remove @ if the user included it
    const formattedUsername = newUsername.trim().replace(/^@/, '');

    if (!formattedUsername) {
      return { error: "Username cannot be empty." };
    }

    if (formattedUsername.length < 3) {
      return { error: "Username must be at least 3 characters." };
    }

    // Check if it's already taken
    const existing = await db.select().from(user).where(eq(user.username, formattedUsername));
    if (existing.length > 0 && existing[0].id !== session.user.id) {
      return { error: "This username is already taken." };
    }

    // Update the username
    await db.update(user).set({ username: formattedUsername }).where(eq(user.id, session.user.id));
    
    // We should invalidate layouts to ensure the TopNav updates (though better-auth useSession might need a page reload or revalidate)
    revalidatePath("/", "layout");

    return { success: true, username: formattedUsername };
  } catch (error) {
    console.error("Failed to update username:", error);
    return { error: "Internal Server Error" };
  }
}

export async function getNotificationPreferences() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const u = await db.select({
      emailReminders: user.emailReminders,
      emailRoomActivity: user.emailRoomActivity,
    }).from(user).where(eq(user.id, session.user.id));

    if (u.length === 0) return { error: "User not found" };

    return { success: true, preferences: u[0] };
  } catch (error) {
    console.error("Failed to fetch notification preferences:", error);
    return { error: "Internal Server Error" };
  }
}

export async function updateNotificationPreferences(emailReminders: boolean, emailRoomActivity: boolean) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    await db.update(user)
      .set({ emailReminders, emailRoomActivity })
      .where(eq(user.id, session.user.id));

    return { success: true };
  } catch (error) {
    console.error("Failed to update notification preferences:", error);
    return { error: "Internal Server Error" };
  }
}

export async function wipeAccountAndFilesAction() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const { s3Client } = await import("@/lib/s3");
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const { file, assignmentSubmission } = await import("@/db/schema");
    const bucket = process.env.S3_BUCKET_NAME!;

    // 1. Delete user's study room files from S3
    const userFiles = await db.select({ fileUrl: file.url }).from(file).where(eq(file.uploadedBy, session.user.id));
    for (const record of userFiles) {
      if (record.fileUrl.includes(bucket)) {
        const urlParts = record.fileUrl.split(`/${bucket}/`);
        if (urlParts.length > 1) {
          await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: urlParts[1] })).catch(console.error);
        }
      }
    }

    // 2. Delete user's assignment submissions from S3
    const userSubmissions = await db.select({ fileUrl: assignmentSubmission.fileUrl }).from(assignmentSubmission).where(eq(assignmentSubmission.userId, session.user.id));
    for (const record of userSubmissions) {
      if (record.fileUrl.includes(bucket)) {
        const urlParts = record.fileUrl.split(`/${bucket}/`);
        if (urlParts.length > 1) {
          await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: urlParts[1] })).catch(console.error);
        }
      }
    }

    // 3. Delete user's avatar from S3 if it exists and is hosted in our bucket
    const userInfo = await db.select({ image: user.image }).from(user).where(eq(user.id, session.user.id));
    if (userInfo.length > 0 && userInfo[0].image && userInfo[0].image.includes(bucket)) {
      const urlParts = userInfo[0].image.split(`/${bucket}/`);
      if (urlParts.length > 1) {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: urlParts[1] })).catch(console.error);
      }
    }

    // 4. Delete user from database (cascades handle related rows)
    await db.delete(user).where(eq(user.id, session.user.id));

    return { success: true };
  } catch (error) {
    console.error("Failed to wipe account:", error);
    return { error: "Internal Server Error" };
  }
}
