import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { roomMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const roomId = formData.get("roomId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!roomId) {
      return NextResponse.json({ error: "No roomId provided" }, { status: 400 });
    }

    // 3. Check membership & role in the DB
    const membership = await db.select().from(roomMember).where(
      and(eq(roomMember.roomId, roomId), eq(roomMember.userId, session.user.id))
    );

    if (membership.length === 0) {
      return NextResponse.json({ error: "Not a member of this room" }, { status: 403 });
    }
    const role = membership[0].role;
    if (role !== "owner" && role !== "editor") {
      return NextResponse.json({ error: "You do not have permission to upload files here" }, { status: 403 });
    }

    // 4. Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 5. Generate unique filename
    const uniqueId = crypto.randomUUID();
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const fileName = `${uniqueId}.${extension}`;

    // 6. Write file to public/uploads
    const path = join(process.cwd(), "public", "uploads", fileName);
    await writeFile(path, buffer);

    // 7. Return the local URL and original name
    const fileUrl = `/uploads/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      fileUrl,
      fileName: originalName 
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
