"use server";

import { db } from "@/db";
import { room, roomMember } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Helper to generate a random 6-character alphanumeric string
function generateInviteCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function dispatchRoomActivityEmail(roomId: string, actorName: string, actionDesc: string, roomName: string, excludeUserId: string) {
  try {
    const { user } = await import("@/db/schema");
    const targetUsers = await db.select({ email: user.email, userId: user.id }).from(roomMember)
      .innerJoin(user, eq(roomMember.userId, user.id))
      .where(
        and(
          eq(roomMember.roomId, roomId),
          eq(user.emailRoomActivity, true)
        )
      );

    const emails = targetUsers.filter(u => u.userId !== excludeUserId).map(u => u.email);
    if (emails.length === 0) return;

    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    for (const to of emails) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject: `Studora Activity: ${roomName}`,
        text: `${actorName} ${actionDesc} in room "${roomName}".\n\nLog in to Studora to see the latest updates.\n\nBest,\nStudora Team`
      }).catch(console.error);
    }
  } catch (error) {
    console.error("Failed to dispatch activity email:", error);
  }
}

export async function logActivity(roomId: string, userId: string, action: string, target?: string) {
  try {
    const roomInfo = await db.select({ name: room.name }).from(room).where(eq(room.id, roomId));
    const roomName = roomInfo.length > 0 ? roomInfo[0].name : "Unknown Room";
    
    const { activityLog } = await import("@/db/schema");
    await db.insert(activityLog).values({
      roomId,
      roomName,
      userId,
      action,
      target,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function createRoom(name: string, description?: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    if (!name || name.trim() === "") {
      return { error: "Room name is required" };
    }

    // Attempt to generate a unique invite code
    let inviteCode = generateInviteCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const existing = await db.select().from(room).where(eq(room.inviteCode, inviteCode));
      if (existing.length === 0) {
        isUnique = true;
      } else {
        inviteCode = generateInviteCode();
        attempts++;
      }
    }

    if (!isUnique) {
      return { error: "Failed to generate a unique invite code. Please try again." };
    }

    const roomId = crypto.randomUUID();

    // Insert Room
    await db.insert(room).values({
      id: roomId,
      name,
      description,
      inviteCode,
      ownerId: session.user.id,
    });

    // Add Owner to Members Table
    await db.insert(roomMember).values({
      roomId,
      userId: session.user.id,
      role: 'owner',
    });

    await logActivity(roomId, session.user.id, "created the room");

    revalidatePath("/dashboard");
    return { success: true, roomId, inviteCode };

  } catch (error) {
    console.error("Failed to create room:", error);
    return { error: "Internal Server Error" };
  }
}

export async function joinRoom(inviteCode: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const formattedCode = inviteCode.trim().toUpperCase();

    if (!formattedCode) {
      return { error: "Invite code is required" };
    }

    // Find the room
    const targetRoom = await db.select().from(room).where(eq(room.inviteCode, formattedCode));

    if (targetRoom.length === 0) {
      return { error: "Invalid invite code or room does not exist." };
    }

    const roomId = targetRoom[0].id;

    // Check if already a member
    const existingMembership = await db.select().from(roomMember).where(
      and(
        eq(roomMember.roomId, roomId),
        eq(roomMember.userId, session.user.id)
      )
    );

    if (existingMembership.length > 0) {
      return { error: "You are already a member of this room." };
    }

    // Add User to Members Table as Viewer
    await db.insert(roomMember).values({
      roomId,
      userId: session.user.id,
      role: 'viewer',
    });

    await logActivity(roomId, session.user.id, "joined the room");
    
    // Dispatch email
    dispatchRoomActivityEmail(roomId, session.user.name, "joined the room", targetRoom[0].name, session.user.id);

    revalidatePath("/dashboard");
    return { success: true, roomId };

  } catch (error) {
    console.error("Failed to join room:", error);
    return { error: "Internal Server Error" };
  }
}

export async function getUserRooms() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized", rooms: [] };
    }

    // Get all rooms where the user is a member, joined with room details
    // We do a manual join approach or use db query builder
    const userRooms = await db.select({
      id: room.id,
      name: room.name,
      description: room.description,
      inviteCode: room.inviteCode,
      ownerId: room.ownerId,
      createdAt: room.createdAt,
      role: roomMember.role,
      joinedAt: roomMember.joinedAt
    })
    .from(roomMember)
    .innerJoin(room, eq(roomMember.roomId, room.id))
    .where(eq(roomMember.userId, session.user.id));

    return { success: true, rooms: userRooms };

  } catch (error) {
    console.error("Failed to fetch user rooms:", error);
    return { error: "Internal Server Error", rooms: [] };
  }
}

export async function getRoomDetails(roomId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { error: "Unauthorized" };
    }

    const { user, file } = await import("@/db/schema");
    
    // Run all 4 queries in parallel to drastically improve load time
    const [roomInfo, membership, roomFiles, members] = await Promise.all([
      db.select().from(room).where(eq(room.id, roomId)),
      db.select().from(roomMember).where(
        and(
          eq(roomMember.roomId, roomId),
          eq(roomMember.userId, session.user.id)
        )
      ),
      db.select({
        id: file.id,
        name: file.name,
        url: file.url,
        createdAt: file.createdAt,
        uploaderId: file.uploadedBy,
        uploaderName: user.name,
      })
      .from(file)
      .innerJoin(user, eq(file.uploadedBy, user.id))
      .where(eq(file.roomId, roomId)),
      db.select({
        userId: roomMember.userId,
        role: roomMember.role,
        joinedAt: roomMember.joinedAt,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(roomMember)
      .innerJoin(user, eq(roomMember.userId, user.id))
      .where(eq(roomMember.roomId, roomId))
    ]);

    if (roomInfo.length === 0) {
      return { error: "Room not found" };
    }

    if (membership.length === 0) {
      return { error: "You are not a member of this room" };
    }

    const role = membership[0].role;

    return {
      success: true,
      room: roomInfo[0],
      role,
      files: roomFiles,
      members,
    };
  } catch (error) {
    console.error("Failed to fetch room details:", error);
    return { error: "Internal Server Error" };
  }
}

export async function saveFileRecord(roomId: string, fileName: string, fileUrl: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) return { error: "Unauthorized" };

    // Check Role
    const membership = await db.select().from(roomMember).where(
      and(eq(roomMember.roomId, roomId), eq(roomMember.userId, session.user.id))
    );

    if (membership.length === 0) return { error: "Not a member" };
    const role = membership[0].role;

    if (role !== "owner" && role !== "editor") {
      return { error: "You do not have permission to upload files" };
    }

    const { file } = await import("@/db/schema");
    
    // Insert into file table
    await db.insert(file).values({
      name: fileName,
      url: fileUrl,
      roomId,
      uploadedBy: session.user.id,
    });

    await logActivity(roomId, session.user.id, "uploaded file", fileName);

    // Fetch room name for email
    const roomInfo = await db.select({ name: room.name }).from(room).where(eq(room.id, roomId));
    const roomName = roomInfo.length > 0 ? roomInfo[0].name : "Unknown Room";
    
    // Dispatch email
    dispatchRoomActivityEmail(roomId, session.user.name, `uploaded a new file "${fileName}"`, roomName, session.user.id);

    revalidatePath(`/rooms/${roomId}`);
    return { success: true };
  } catch (error) {
    console.error("Save file record failed:", error);
    return { error: "Internal Server Error" };
  }
}

export async function deleteFileAction(roomId: string, fileId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const membership = await db.select().from(roomMember).where(
      and(eq(roomMember.roomId, roomId), eq(roomMember.userId, session.user.id))
    );
    if (membership.length === 0) return { error: "Not a member" };

    const role = membership[0].role;
    
    // Get file info
    const { file } = await import("@/db/schema");
    const fileRecord = await db.select().from(file).where(eq(file.id, fileId));
    
    if (fileRecord.length === 0) return { error: "File not found" };
    
    if (role === "owner" || (role === "editor" && fileRecord[0].uploadedBy === session.user.id)) {
      await db.delete(file).where(eq(file.id, fileId));
      await logActivity(roomId, session.user.id, "deleted file", fileRecord[0].name);

      const { s3Client } = await import("@/lib/s3");
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      
      const bucket = process.env.S3_BUCKET_NAME!;
      const urlParts = fileRecord[0].url.split(`/${bucket}/`);
      if (urlParts.length > 1) {
        const s3Key = urlParts[1];
        await s3Client.send(new DeleteObjectCommand({
          Bucket: bucket,
          Key: s3Key
        })).catch(console.error);
      }

      revalidatePath(`/rooms/${roomId}`);
      return { success: true };
    }
    
    return { error: "You do not have permission to delete this file" };
  } catch (error) {
    console.error("Delete file failed:", error);
    return { error: "Internal Server Error" };
  }
}

export async function updateMemberRole(roomId: string, targetUserId: string, newRole: 'editor' | 'viewer') {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const membership = await db.select().from(roomMember).where(
      and(eq(roomMember.roomId, roomId), eq(roomMember.userId, session.user.id))
    );
    
    if (membership.length === 0 || membership[0].role !== "owner") {
      return { error: "Only owners can change roles" };
    }

    if (targetUserId === session.user.id) {
      return { error: "Cannot change your own role this way" };
    }

    await db.update(roomMember)
      .set({ role: newRole })
      .where(and(eq(roomMember.roomId, roomId), eq(roomMember.userId, targetUserId)));

    const { user } = await import("@/db/schema");
    const targetInfo = await db.select({ name: user.name }).from(user).where(eq(user.id, targetUserId));
    const tName = targetInfo.length > 0 ? targetInfo[0].name : "a member";

    await logActivity(roomId, session.user.id, `changed role to ${newRole} for`, tName);

    revalidatePath(`/rooms/${roomId}`);
    return { success: true };
  } catch (error) {
    console.error("Update role failed:", error);
    return { error: "Internal Server Error" };
  }
}

export async function removeMember(roomId: string, targetUserId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const membership = await db.select().from(roomMember).where(
      and(eq(roomMember.roomId, roomId), eq(roomMember.userId, session.user.id))
    );
    
    if (membership.length === 0 || membership[0].role !== "owner") {
      return { error: "Only owners can remove members" };
    }

    if (targetUserId === session.user.id) {
      return { error: "Cannot remove yourself (transfer ownership first)" };
    }

    await db.delete(roomMember)
      .where(and(eq(roomMember.roomId, roomId), eq(roomMember.userId, targetUserId)));

    const { user } = await import("@/db/schema");
    const targetInfo = await db.select({ name: user.name }).from(user).where(eq(user.id, targetUserId));
    const tName = targetInfo.length > 0 ? targetInfo[0].name : "a member";

    await logActivity(roomId, session.user.id, "removed member", tName);

    revalidatePath(`/rooms/${roomId}`);
    return { success: true };
  } catch (error) {
    console.error("Remove member failed:", error);
    return { error: "Internal Server Error" };
  }
}

export async function renameRoomAction(roomId: string, newName: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const membership = await db.select().from(roomMember).where(
      and(eq(roomMember.roomId, roomId), eq(roomMember.userId, session.user.id))
    );
    
    if (membership.length === 0 || membership[0].role !== "owner") {
      return { error: "Only owners can rename the room" };
    }

    if (!newName || newName.trim() === "") return { error: "Name cannot be empty" };

    await db.update(room).set({ name: newName }).where(eq(room.id, roomId));
    await logActivity(roomId, session.user.id, "renamed room to", newName);
    revalidatePath(`/rooms/${roomId}`);
    return { success: true };
  } catch (error) {
    console.error("Rename room failed:", error);
    return { error: "Internal Server Error" };
  }
}

export async function transferOwnership(roomId: string, targetUserId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const membership = await db.select().from(roomMember).where(
      and(eq(roomMember.roomId, roomId), eq(roomMember.userId, session.user.id))
    );
    
    if (membership.length === 0 || membership[0].role !== "owner") {
      return { error: "Only owners can transfer ownership" };
    }

    if (targetUserId === session.user.id) {
      return { error: "You are already the owner" };
    }

    // Upgrade target user to owner
    await db.update(roomMember)
      .set({ role: 'owner' })
      .where(and(eq(roomMember.roomId, roomId), eq(roomMember.userId, targetUserId)));

    // Downgrade current user to editor
    await db.update(roomMember)
      .set({ role: 'editor' })
      .where(and(eq(roomMember.roomId, roomId), eq(roomMember.userId, session.user.id)));
      
    // Update the room's ownerId
    await db.update(room).set({ ownerId: targetUserId }).where(eq(room.id, roomId));

    const { user } = await import("@/db/schema");
    const targetInfo = await db.select({ name: user.name }).from(user).where(eq(user.id, targetUserId));
    const tName = targetInfo.length > 0 ? targetInfo[0].name : "a member";

    await logActivity(roomId, session.user.id, "transferred ownership to", tName);

    revalidatePath(`/rooms/${roomId}`);
    return { success: true };
  } catch (error) {
    console.error("Transfer ownership failed:", error);
    return { error: "Internal Server Error" };
  }
}

export async function deleteRoomAction(roomId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const membership = await db.select().from(roomMember).where(
      and(eq(roomMember.roomId, roomId), eq(roomMember.userId, session.user.id))
    );
    
    if (membership.length === 0 || membership[0].role !== "owner") {
      return { error: "Only owners can delete the room" };
    }

    await db.delete(room).where(eq(room.id, roomId)); // Cascades to members and files

    await logActivity(roomId, session.user.id, "deleted the room");

    revalidatePath(`/dashboard`);
    return { success: true };
  } catch (error) {
    console.error("Delete room failed:", error);
    return { error: "Internal Server Error" };
  }
}

export async function getRecentActivity() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized", activities: [] };

    const { activityLog, assignmentActivityLog, user } = await import("@/db/schema");

    // Get user's study rooms
    const userRooms = await db.select({ roomId: roomMember.roomId }).from(roomMember).where(eq(roomMember.userId, session.user.id));
    const roomIds = userRooms.map(r => r.roomId);

    // Get user's assignment rooms
    const { assignmentRoomMember } = await import("@/db/schema");
    const userAssignmentRooms = await db.select({ roomId: assignmentRoomMember.roomId }).from(assignmentRoomMember).where(eq(assignmentRoomMember.userId, session.user.id));
    const assignmentRoomIds = userAssignmentRooms.map(r => r.roomId);

    let logs: any[] = [];

    if (roomIds.length > 0) {
      const studyLogs = await db.select({
        id: activityLog.id,
        user: user.name,
        username: user.username,
        action: activityLog.action,
        target: activityLog.target,
        roomName: activityLog.roomName,
        createdAt: activityLog.createdAt,
      })
      .from(activityLog)
      .innerJoin(user, eq(activityLog.userId, user.id))
      .where(inArray(activityLog.roomId, roomIds))
      .orderBy(desc(activityLog.createdAt))
      .limit(30);
      logs = [...logs, ...studyLogs];
    }

    if (assignmentRoomIds.length > 0) {
      const assignLogs = await db.select({
        id: assignmentActivityLog.id,
        user: user.name,
        username: user.username,
        action: assignmentActivityLog.action,
        target: assignmentActivityLog.target,
        roomName: assignmentActivityLog.roomName,
        createdAt: assignmentActivityLog.createdAt,
      })
      .from(assignmentActivityLog)
      .innerJoin(user, eq(assignmentActivityLog.userId, user.id))
      .where(inArray(assignmentActivityLog.roomId, assignmentRoomIds))
      .orderBy(desc(assignmentActivityLog.createdAt))
      .limit(30);
      logs = [...logs, ...assignLogs];
    }

    // Sort combined logs by date descending and take top 30
    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    logs = logs.slice(0, 30);

    return { success: true, activities: logs };
  } catch (error) {
    console.error("Failed to fetch activity:", error);
    return { error: "Internal Server Error", activities: [] };
  }
}
