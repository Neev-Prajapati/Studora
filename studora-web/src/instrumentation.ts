export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import('node-cron');
    
    console.log("[Cron] Registering expired assignment cleanup & reminder job...");

    cron.default.schedule('* * * * *', async () => {
      try {
        const { db } = await import('@/db');
        const { assignment, assignmentRoomMember, assignmentSubmission, user, assignmentRoom } = await import('@/db/schema');
        const { lt, and, eq, gte } = await import('drizzle-orm');
        const nodemailer = await import('nodemailer');
        
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const now = new Date();
        const nowMs = now.getTime();
        
        const hr24 = 24 * 60 * 60 * 1000;
        const hr4 = 4 * 60 * 60 * 1000;
        
        const nowPlus24 = new Date(nowMs + hr24);
        const nowPlus4 = new Date(nowMs + hr4);
        
        // 1. Process 24-hour reminders
        const upcoming24h = await db.select().from(assignment).where(
          and(
            lt(assignment.deadline, nowPlus24),
            gte(assignment.deadline, now),
            eq(assignment.reminder24hSent, false)
          )
        );
        
        for (const asm of upcoming24h) {
          const roomInfo = await db.select().from(assignmentRoom).where(eq(assignmentRoom.id, asm.roomId));
          const roomName = roomInfo.length > 0 ? roomInfo[0].name : "Unknown Room";
          
          const submissions = await db.select({ userId: assignmentSubmission.userId }).from(assignmentSubmission).where(eq(assignmentSubmission.assignmentId, asm.id));
          const submittedUserIds = submissions.map(s => s.userId);
          
          let targetUsersQuery = db.select({ email: user.email, name: user.name, userId: user.id }).from(assignmentRoomMember)
            .innerJoin(user, eq(assignmentRoomMember.userId, user.id))
            .where(eq(assignmentRoomMember.roomId, asm.roomId));
            
          const targetUsers = await targetUsersQuery;
          const usersToEmail = targetUsers.filter(tu => !submittedUserIds.includes(tu.userId));
          
          for (const u of usersToEmail) {
            await transporter.sendMail({
              from: process.env.SMTP_USER,
              to: u.email,
              subject: `Reminder: Assignment "${asm.title}" due in 24 hours!`,
              text: `Hi ${u.name},\n\nJust a friendly reminder that your assignment "${asm.title}" in room "${roomName}" is due in less than 24 hours.\n\nPlease make sure to submit your solution before the deadline!\n\nBest,\nStudora Team`
            }).catch(console.error);
          }
          
          await db.update(assignment).set({ reminder24hSent: true }).where(eq(assignment.id, asm.id));
          console.log(`[Cron] Sent 24h reminder for assignment ${asm.id}`);
        }
        
        // 2. Process 4-hour reminders
        const upcoming4h = await db.select().from(assignment).where(
          and(
            lt(assignment.deadline, nowPlus4),
            gte(assignment.deadline, now),
            eq(assignment.reminder4hSent, false)
          )
        );
        
        for (const asm of upcoming4h) {
          const roomInfo = await db.select().from(assignmentRoom).where(eq(assignmentRoom.id, asm.roomId));
          const roomName = roomInfo.length > 0 ? roomInfo[0].name : "Unknown Room";
          
          const submissions = await db.select({ userId: assignmentSubmission.userId }).from(assignmentSubmission).where(eq(assignmentSubmission.assignmentId, asm.id));
          const submittedUserIds = submissions.map(s => s.userId);
          
          let targetUsersQuery = db.select({ email: user.email, name: user.name, userId: user.id }).from(assignmentRoomMember)
            .innerJoin(user, eq(assignmentRoomMember.userId, user.id))
            .where(eq(assignmentRoomMember.roomId, asm.roomId));
            
          const targetUsers = await targetUsersQuery;
          const usersToEmail = targetUsers.filter(tu => !submittedUserIds.includes(tu.userId));
          
          for (const u of usersToEmail) {
            await transporter.sendMail({
              from: process.env.SMTP_USER,
              to: u.email,
              subject: `URGENT: Assignment "${asm.title}" due in 4 hours!`,
              text: `Hi ${u.name},\n\nThis is an URGENT reminder that your assignment "${asm.title}" in room "${roomName}" is due in less than 4 hours.\n\nPlease submit your work as soon as possible to avoid missing the deadline.\n\nBest,\nStudora Team`
            }).catch(console.error);
          }
          
          await db.update(assignment).set({ reminder4hSent: true }).where(eq(assignment.id, asm.id));
          console.log(`[Cron] Sent 4h reminder for assignment ${asm.id}`);
        }

        // 3. Delete expired assignments
        const deleted = await db.delete(assignment)
          .where(lt(assignment.deadline, now))
          .returning({ id: assignment.id, title: assignment.title });
          
        if (deleted.length > 0) {
          console.log(`[Cron] Deleted ${deleted.length} expired assignment(s):`, deleted.map(a => a.title).join(", "));
        }
      } catch (error) {
        console.error("[Cron] Failed to run cron job:", error);
      }
    });
  }
}
