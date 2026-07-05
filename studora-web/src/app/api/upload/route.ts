import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { roomMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const roomId = formData.get("roomId") as string | null;
    const roomType = (formData.get("roomType") as string) || "study";
    const uploadType = (formData.get("uploadType") as string) || "material";

    if (!file || !roomId) return NextResponse.json({ error: "File and roomId are required" }, { status: 400 });

    if (roomType === "study") {
      const membership = await db.select().from(roomMember).where(
        and(eq(roomMember.roomId, roomId), eq(roomMember.userId, session.user.id))
      );
      if (membership.length === 0 || (membership[0].role !== "owner" && membership[0].role !== "editor")) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }
    } else if (roomType === "assignment") {
      const { assignmentRoomMember } = await import("@/db/schema");
      const membership = await db.select().from(assignmentRoomMember).where(
        and(eq(assignmentRoomMember.roomId, roomId), eq(assignmentRoomMember.userId, session.user.id))
      );
      if (membership.length === 0) {
        return NextResponse.json({ error: "Permission denied (not in room)" }, { status: 403 });
      }
      const role = membership[0].role;
      if (uploadType === "assignment" && role !== "owner" && role !== "editor") {
        return NextResponse.json({ error: "Permission denied (only owners/editors can create assignments)" }, { status: 403 });
      }
      if (uploadType === "solution" && role !== "viewer") {
        // Technically anyone could submit, but normally students (viewers) submit. 
        // We'll allow owners/editors to submit too for testing.
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueId = crypto.randomUUID();
    const extension = file.name.split('.').pop();
    const s3Key = `${roomId}/${uniqueId}.${extension}`;
    const bucket = process.env.S3_BUCKET_NAME!;

    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type,
    }));

    const publicBaseUrl = process.env.S3_ENDPOINT!.replace('/s3', '/object/public');
    const fileUrl = `${publicBaseUrl}/${bucket}/${s3Key}`;

    return NextResponse.json({ success: true, fileUrl, fileName: file.name });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
