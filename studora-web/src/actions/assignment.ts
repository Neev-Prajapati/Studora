"use server";

import { db } from "@/db";
import { assignmentRoom, assignmentRoomMember, assignment, assignmentSubmission, user } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
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

async function dispatchAssignmentActivityEmail(roomId: string, actorName: string, actionDesc: string, roomName: string, excludeUserId: string) {
  try {
    const { user } = await import("@/db/schema");
    const targetUsers = await db.select({ email: user.email, userId: user.id }).from(assignmentRoomMember)
      .innerJoin(user, eq(assignmentRoomMember.userId, user.id))
      .where(
        and(
          eq(assignmentRoomMember.roomId, roomId),
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

export async function logAssignmentActivity(roomId: string, userId: string, action: string, target?: string) {
  try {
    const roomInfo = await db.select({ name: assignmentRoom.name }).from(assignmentRoom).where(eq(assignmentRoom.id, roomId));
    const roomName = roomInfo.length > 0 ? roomInfo[0].name : "Unknown Room";
    
    const { assignmentActivityLog } = await import("@/db/schema");
    await db.insert(assignmentActivityLog).values({
      roomId,
      roomName,
      userId,
      action,
      target,
    });
  } catch (error) {
    console.error("Failed to log assignment activity:", error);
  }
}

export async function createAssignmentRoom(name: string, description?: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };
    if (!name || name.trim() === "") return { error: "Room name is required" };

    let inviteCode = generateInviteCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const existing = await db.select().from(assignmentRoom).where(eq(assignmentRoom.inviteCode, inviteCode));
      if (existing.length === 0) {
        isUnique = true;
      } else {
        inviteCode = generateInviteCode();
        attempts++;
      }
    }

    if (!isUnique) return { error: "Failed to generate a unique invite code. Please try again." };

    const roomId = crypto.randomUUID();

    await db.insert(assignmentRoom).values({
      id: roomId,
      name,
      description,
      inviteCode,
      ownerId: session.user.id,
    });

    await db.insert(assignmentRoomMember).values({
      roomId,
      userId: session.user.id,
      role: 'owner',
    });

    await logAssignmentActivity(roomId, session.user.id, "created the assignment room");

    revalidatePath("/assignments");
    return { success: true, roomId, inviteCode };
  } catch (error) {
    console.error("Failed to create assignment room:", error);
    return { error: "Internal Server Error" };
  }
}

export async function joinAssignmentRoom(inviteCode: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const formattedCode = inviteCode.trim().toUpperCase();
    if (!formattedCode) return { error: "Invite code is required" };

    const targetRoom = await db.select().from(assignmentRoom).where(eq(assignmentRoom.inviteCode, formattedCode));
    if (targetRoom.length === 0) return { error: "Invalid invite code or room does not exist." };

    const roomId = targetRoom[0].id;

    const existingMembership = await db.select().from(assignmentRoomMember).where(
      and(eq(assignmentRoomMember.roomId, roomId), eq(assignmentRoomMember.userId, session.user.id))
    );

    if (existingMembership.length > 0) return { error: "You are already a member of this room." };

    await db.insert(assignmentRoomMember).values({
      roomId,
      userId: session.user.id,
      role: 'viewer',
    });

    await logAssignmentActivity(roomId, session.user.id, "joined the assignment room");
    
    dispatchAssignmentActivityEmail(roomId, session.user.name, "joined the assignment room", targetRoom[0].name, session.user.id);

    revalidatePath("/assignments");
    return { success: true, roomId };
  } catch (error) {
    console.error("Failed to join assignment room:", error);
    return { error: "Internal Server Error" };
  }
}

export async function getAssignmentRooms() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized", rooms: [] };

    const userRooms = await db.select({
      id: assignmentRoom.id,
      name: assignmentRoom.name,
      description: assignmentRoom.description,
      inviteCode: assignmentRoom.inviteCode,
      ownerId: assignmentRoom.ownerId,
      createdAt: assignmentRoom.createdAt,
      role: assignmentRoomMember.role,
      joinedAt: assignmentRoomMember.joinedAt
    })
    .from(assignmentRoomMember)
    .innerJoin(assignmentRoom, eq(assignmentRoomMember.roomId, assignmentRoom.id))
    .where(eq(assignmentRoomMember.userId, session.user.id));

    return { success: true, rooms: userRooms };
  } catch (error) {
    console.error("Failed to fetch user assignment rooms:", error);
    return { error: "Internal Server Error", rooms: [] };
  }
}

export async function getAssignmentRoomDetails(roomId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const [roomInfo, membership, members, assignments] = await Promise.all([
      db.select().from(assignmentRoom).where(eq(assignmentRoom.id, roomId)),
      db.select().from(assignmentRoomMember).where(
        and(eq(assignmentRoomMember.roomId, roomId), eq(assignmentRoomMember.userId, session.user.id))
      ),
      db.select({
        userId: assignmentRoomMember.userId,
        role: assignmentRoomMember.role,
        joinedAt: assignmentRoomMember.joinedAt,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(assignmentRoomMember)
      .innerJoin(user, eq(assignmentRoomMember.userId, user.id))
      .where(eq(assignmentRoomMember.roomId, roomId)),
      db.select({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        fileUrl: assignment.fileUrl,
        fileName: assignment.fileName,
        deadline: assignment.deadline,
        createdAt: assignment.createdAt,
        createdBy: user.name,
        createdById: assignment.createdBy
      })
      .from(assignment)
      .innerJoin(user, eq(assignment.createdBy, user.id))
      .where(eq(assignment.roomId, roomId))
      .orderBy(desc(assignment.createdAt))
    ]);

    if (roomInfo.length === 0) return { error: "Room not found" };
    if (membership.length === 0) return { error: "You are not a member of this room" };

    const role = membership[0].role;

    return { success: true, room: roomInfo[0], role, members, assignments };
  } catch (error) {
    console.error("Failed to fetch room details:", error);
    return { error: "Internal Server Error" };
  }
}

export async function createAssignmentRecord(roomId: string, title: string, description: string, fileUrl: string, fileName: string, deadlineStr: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const membership = await db.select().from(assignmentRoomMember).where(
      and(eq(assignmentRoomMember.roomId, roomId), eq(assignmentRoomMember.userId, session.user.id))
    );
    if (membership.length === 0) return { error: "Not a member" };

    const role = membership[0].role;
    if (role !== "owner" && role !== "editor") {
      return { error: "Only owners and editors can create assignments" };
    }

    await db.insert(assignment).values({
      roomId,
      title,
      description,
      fileUrl,
      fileName,
      deadline: new Date(deadlineStr),
      createdBy: session.user.id
    });

    await logAssignmentActivity(roomId, session.user.id, "posted an assignment", title);

    const roomInfo = await db.select({ name: assignmentRoom.name }).from(assignmentRoom).where(eq(assignmentRoom.id, roomId));
    const roomName = roomInfo.length > 0 ? roomInfo[0].name : "Unknown Room";
    dispatchAssignmentActivityEmail(roomId, session.user.name, `posted a new assignment "${title}"`, roomName, session.user.id);

    revalidatePath(`/assignments/${roomId}`);
    return { success: true };
  } catch (error) {
    console.error("Save assignment record failed:", error);
    return { error: "Internal Server Error" };
  }
}

export async function submitAssignmentSolutionAction(assignmentId: string, roomId: string, fileUrl: string, fileName: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const membership = await db.select().from(assignmentRoomMember).where(
      and(eq(assignmentRoomMember.roomId, roomId), eq(assignmentRoomMember.userId, session.user.id))
    );
    if (membership.length === 0) return { error: "Not a member of the room" };

    // Delete existing submission from this user for this assignment if any
    await db.delete(assignmentSubmission).where(
      and(eq(assignmentSubmission.assignmentId, assignmentId), eq(assignmentSubmission.userId, session.user.id))
    );

    await db.insert(assignmentSubmission).values({
      assignmentId,
      userId: session.user.id,
      fileUrl,
      fileName,
    });

    await logAssignmentActivity(roomId, session.user.id, "submitted a solution for", fileName);

    const roomInfo = await db.select({ name: assignmentRoom.name }).from(assignmentRoom).where(eq(assignmentRoom.id, roomId));
    const roomName = roomInfo.length > 0 ? roomInfo[0].name : "Unknown Room";
    
    dispatchAssignmentActivityEmail(roomId, session.user.name, `submitted a solution for "${fileName}"`, roomName, session.user.id);

    revalidatePath(`/assignments/${roomId}`);
    return { success: true };
  } catch (error) {
    console.error("Submit solution failed:", error);
    return { error: "Internal Server Error" };
  }
}

export async function getAssignmentSubmissions(assignmentId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized", submissions: [] };

    const submissions = await db
      .select({
        id: assignmentSubmission.id,
        fileUrl: assignmentSubmission.fileUrl,
        fileName: assignmentSubmission.fileName,
        submittedAt: assignmentSubmission.submittedAt,
        userId: user.id,
        userName: user.name,
      })
      .from(assignmentSubmission)
      .innerJoin(user, eq(assignmentSubmission.userId, user.id))
      .where(eq(assignmentSubmission.assignmentId, assignmentId))
      .orderBy(desc(assignmentSubmission.submittedAt));

    return { success: true, submissions };
  } catch (error) {
    console.error("Failed to fetch submissions:", error);
    return { error: "Internal Server Error", submissions: [] };
  }
}

export async function deleteAssignmentAction(assignmentId: string, roomId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const membership = await db.select().from(assignmentRoomMember).where(
      and(eq(assignmentRoomMember.roomId, roomId), eq(assignmentRoomMember.userId, session.user.id))
    );
    if (membership.length === 0) return { error: "Not a member" };

    const role = membership[0].role;
    
    const assignmentRecord = await db.select().from(assignment).where(eq(assignment.id, assignmentId));
    if (assignmentRecord.length === 0) return { error: "Assignment not found" };
    
    if (role === "owner" || (role === "editor" && assignmentRecord[0].createdBy === session.user.id)) {
      await db.delete(assignment).where(eq(assignment.id, assignmentId));

      const { s3Client } = await import("@/lib/s3");
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const bucket = process.env.S3_BUCKET_NAME!;
      const urlParts = assignmentRecord[0].fileUrl.split(`/${bucket}/`);
      if (urlParts.length > 1) {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: urlParts[1] })).catch(console.error);
      }

      await logAssignmentActivity(roomId, session.user.id, "deleted an assignment", assignmentRecord[0].title);

      revalidatePath(`/assignments/${roomId}`);
      return { success: true };
    }
    
    return { error: "You do not have permission to delete this assignment" };
  } catch (error) {
    console.error("Delete assignment failed:", error);
    return { error: "Internal Server Error" };
  }
}

export async function updateAssignmentDeadlineAction(assignmentId: string, roomId: string, newDeadlineStr: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const membership = await db.select().from(assignmentRoomMember).where(
      and(eq(assignmentRoomMember.roomId, roomId), eq(assignmentRoomMember.userId, session.user.id))
    );
    if (membership.length === 0) return { error: "Not a member" };

    const role = membership[0].role;
    
    const assignmentRecord = await db.select().from(assignment).where(eq(assignment.id, assignmentId));
    if (assignmentRecord.length === 0) return { error: "Assignment not found" };
    
    if (role === "owner" || (role === "editor" && assignmentRecord[0].createdBy === session.user.id)) {
      const newDeadline = new Date(newDeadlineStr);
      await db.update(assignment).set({ deadline: newDeadline }).where(eq(assignment.id, assignmentId));
      
      await logAssignmentActivity(roomId, session.user.id, "updated the deadline for", assignmentRecord[0].title);
      
      revalidatePath(`/assignments/${roomId}`);
      return { success: true };
    }
    
    return { error: "You do not have permission to edit this assignment" };
  } catch (error) {
    console.error("Update deadline failed:", error);
    return { error: "Internal Server Error" };
  }
}

export async function updateAssignmentMemberRole(roomId: string, targetUserId: string, newRole: 'editor' | 'viewer') {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const membership = await db.select().from(assignmentRoomMember).where(
      and(eq(assignmentRoomMember.roomId, roomId), eq(assignmentRoomMember.userId, session.user.id))
    );
    
    if (membership.length === 0 || membership[0].role !== "owner") return { error: "Only owners can change roles" };
    if (targetUserId === session.user.id) return { error: "Cannot change your own role this way" };

    await db.update(assignmentRoomMember)
      .set({ role: newRole })
      .where(and(eq(assignmentRoomMember.roomId, roomId), eq(assignmentRoomMember.userId, targetUserId)));

    const { user } = await import("@/db/schema");
    const targetInfo = await db.select({ name: user.name }).from(user).where(eq(user.id, targetUserId));
    const tName = targetInfo.length > 0 ? targetInfo[0].name : "a member";
    await logAssignmentActivity(roomId, session.user.id, `changed role to ${newRole} for`, tName);

    revalidatePath(`/assignments/${roomId}`);
    return { success: true };
  } catch (error) {
    console.error("Update role failed:", error);
    return { error: "Internal Server Error" };
  }
}

export async function removeAssignmentMember(roomId: string, targetUserId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const membership = await db.select().from(assignmentRoomMember).where(
      and(eq(assignmentRoomMember.roomId, roomId), eq(assignmentRoomMember.userId, session.user.id))
    );
    
    if (membership.length === 0 || membership[0].role !== "owner") return { error: "Only owners can remove members" };
    if (targetUserId === session.user.id) return { error: "Cannot remove yourself (transfer ownership first)" };

    await db.delete(assignmentRoomMember)
      .where(and(eq(assignmentRoomMember.roomId, roomId), eq(assignmentRoomMember.userId, targetUserId)));

    const { user } = await import("@/db/schema");
    const targetInfo = await db.select({ name: user.name }).from(user).where(eq(user.id, targetUserId));
    const tName = targetInfo.length > 0 ? targetInfo[0].name : "a member";
    await logAssignmentActivity(roomId, session.user.id, "removed member", tName);

    revalidatePath(`/assignments/${roomId}`);
    return { success: true };
  } catch (error) {
    console.error("Remove member failed:", error);
    return { error: "Internal Server Error" };
  }
}

export async function renameAssignmentRoomAction(roomId: string, newName: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const membership = await db.select().from(assignmentRoomMember).where(
      and(eq(assignmentRoomMember.roomId, roomId), eq(assignmentRoomMember.userId, session.user.id))
    );
    
    if (membership.length === 0 || membership[0].role !== "owner") return { error: "Only owners can rename the room" };
    if (!newName || newName.trim() === "") return { error: "Name cannot be empty" };

    await db.update(assignmentRoom).set({ name: newName }).where(eq(assignmentRoom.id, roomId));
    await logAssignmentActivity(roomId, session.user.id, "renamed room to", newName);
    
    revalidatePath(`/assignments/${roomId}`);
    return { success: true };
  } catch (error) {
    console.error("Rename room failed:", error);
    return { error: "Internal Server Error" };
  }
}

export async function transferAssignmentOwnership(roomId: string, targetUserId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const membership = await db.select().from(assignmentRoomMember).where(
      and(eq(assignmentRoomMember.roomId, roomId), eq(assignmentRoomMember.userId, session.user.id))
    );
    
    if (membership.length === 0 || membership[0].role !== "owner") return { error: "Only owners can transfer ownership" };
    if (targetUserId === session.user.id) return { error: "You are already the owner" };

    await db.update(assignmentRoomMember)
      .set({ role: 'owner' })
      .where(and(eq(assignmentRoomMember.roomId, roomId), eq(assignmentRoomMember.userId, targetUserId)));

    await db.update(assignmentRoomMember)
      .set({ role: 'editor' })
      .where(and(eq(assignmentRoomMember.roomId, roomId), eq(assignmentRoomMember.userId, session.user.id)));
      
    await db.update(assignmentRoom).set({ ownerId: targetUserId }).where(eq(assignmentRoom.id, roomId));

    const { user } = await import("@/db/schema");
    const targetInfo = await db.select({ name: user.name }).from(user).where(eq(user.id, targetUserId));
    const tName = targetInfo.length > 0 ? targetInfo[0].name : "a member";
    await logAssignmentActivity(roomId, session.user.id, "transferred ownership to", tName);

    revalidatePath(`/assignments/${roomId}`);
    return { success: true };
  } catch (error) {
    console.error("Transfer ownership failed:", error);
    return { error: "Internal Server Error" };
  }
}

export async function deleteAssignmentRoomAction(roomId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const membership = await db.select().from(assignmentRoomMember).where(
      and(eq(assignmentRoomMember.roomId, roomId), eq(assignmentRoomMember.userId, session.user.id))
    );
    
    if (membership.length === 0 || membership[0].role !== "owner") return { error: "Only owners can delete the room" };

    await db.delete(assignmentRoom).where(eq(assignmentRoom.id, roomId));
    await logAssignmentActivity(roomId, session.user.id, "deleted the assignment room");

    revalidatePath(`/assignments`);
    return { success: true };
  } catch (error) {
    console.error("Delete room failed:", error);
    return { error: "Internal Server Error" };
  }
}

export async function getUpcomingDeadlines() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized", deadlines: [] };

    // Get user's assignment rooms
    const userAssignmentRooms = await db
      .select({ roomId: assignmentRoomMember.roomId })
      .from(assignmentRoomMember)
      .where(eq(assignmentRoomMember.userId, session.user.id));
      
    const roomIds = userAssignmentRooms.map(r => r.roomId);

    if (roomIds.length === 0) return { success: true, deadlines: [] };

    // Fetch assignments for those rooms that have deadlines in the future or recently past (like last 24h)
    // To keep it simple, fetch all assignments and we can filter or sort them. We'll get ones with deadline > now - 24 hours
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { inArray, gt, asc } = await import("drizzle-orm");
    
    const upcomingAssignments = await db
      .select({
        id: assignment.id,
        title: assignment.title,
        deadline: assignment.deadline,
        roomName: assignmentRoom.name,
      })
      .from(assignment)
      .innerJoin(assignmentRoom, eq(assignment.roomId, assignmentRoom.id))
      .where(
        and(
          inArray(assignment.roomId, roomIds),
          gt(assignment.deadline, twentyFourHoursAgo)
        )
      )
      .orderBy(asc(assignment.deadline))
      .limit(10); // get closest 10 deadlines

    return { success: true, deadlines: upcomingAssignments };
  } catch (error) {
    console.error("Failed to fetch deadlines:", error);
    return { error: "Internal Server Error", deadlines: [] };
  }
}
