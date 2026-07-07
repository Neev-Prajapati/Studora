import { pgTable, text, timestamp, boolean, primaryKey, pgEnum } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
					id: text("id").primaryKey(),
					name: text("name").notNull(),
					email: text("email").notNull().unique(),
					emailVerified: boolean("email_verified").notNull(),
					image: text("image"),
					createdAt: timestamp("created_at").notNull(),
					updatedAt: timestamp("updated_at").notNull(),
          username: text("username").unique(), // Our custom unique handle
          emailReminders: boolean("email_reminders").notNull().default(true),
          emailRoomActivity: boolean("email_room_activity").notNull().default(true),
});

export const session = pgTable("session", {
					id: text("id").primaryKey(),
					expiresAt: timestamp("expires_at").notNull(),
					token: text("token").notNull().unique(),
					createdAt: timestamp("created_at").notNull(),
					updatedAt: timestamp("updated_at").notNull(),
					ipAddress: text("ip_address"),
					userAgent: text("user_agent"),
					userId: text("user_id").notNull().references(() => user.id)
});

export const account = pgTable("account", {
					id: text("id").primaryKey(),
					accountId: text("account_id").notNull(),
					providerId: text("provider_id").notNull(),
					userId: text("user_id").notNull().references(() => user.id),
					accessToken: text("access_token"),
					refreshToken: text("refresh_token"),
					idToken: text("id_token"),
					accessTokenExpiresAt: timestamp("access_token_expires_at"),
					refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
					scope: text("scope"),
					password: text("password"),
					createdAt: timestamp("created_at").notNull(),
					updatedAt: timestamp("updated_at").notNull()
});

export const verification = pgTable("verification", {
					id: text("id").primaryKey(),
					identifier: text("identifier").notNull(),
					value: text("value").notNull(),
					expiresAt: timestamp("expires_at").notNull(),
					createdAt: timestamp("created_at"),
					updatedAt: timestamp("updated_at")
});

export const roleEnum = pgEnum('role', ['owner', 'editor', 'viewer']);

export const room = pgTable("room", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    inviteCode: text("invite_code").notNull().unique(),
    ownerId: text("owner_id").notNull().references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roomMember = pgTable("room_member", {
    roomId: text("room_id").notNull().references(() => room.id, { onDelete: 'cascade' }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
    role: roleEnum("role").notNull().default('viewer'),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.roomId, table.userId] })
    };
});

export const file = pgTable("file", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    url: text("url").notNull(),
    roomId: text("room_id").notNull().references(() => room.id, { onDelete: 'cascade' }),
    uploadedBy: text("uploaded_by").notNull().references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    podcastScript: text("podcast_script"),
});

export const activityLog = pgTable("activity_log", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    roomId: text("room_id").notNull().references(() => room.id, { onDelete: 'cascade' }),
    roomName: text("room_name").notNull(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
    action: text("action").notNull(),
    target: text("target"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assignmentRoom = pgTable("assignment_room", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    inviteCode: text("invite_code").notNull().unique(),
    ownerId: text("owner_id").notNull().references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assignmentRoomMember = pgTable("assignment_room_member", {
    roomId: text("room_id").notNull().references(() => assignmentRoom.id, { onDelete: 'cascade' }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
    role: roleEnum("role").notNull().default('viewer'),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.roomId, table.userId] })
    };
});

export const assignment = pgTable("assignment", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    roomId: text("room_id").notNull().references(() => assignmentRoom.id, { onDelete: 'cascade' }),
    title: text("title").notNull(),
    description: text("description"),
    fileUrl: text("file_url").notNull(),
    fileName: text("file_name").notNull(),
    deadline: timestamp("deadline").notNull(),
    reminder24hSent: boolean("reminder_24h_sent").default(false).notNull(),
    reminder4hSent: boolean("reminder_4h_sent").default(false).notNull(),
    createdBy: text("created_by").notNull().references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assignmentSubmission = pgTable("assignment_submission", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    assignmentId: text("assignment_id").notNull().references(() => assignment.id, { onDelete: 'cascade' }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
    fileUrl: text("file_url").notNull(),
    fileName: text("file_name").notNull(),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const assignmentActivityLog = pgTable("assignment_activity_log", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    roomId: text("room_id").notNull().references(() => assignmentRoom.id, { onDelete: 'cascade' }),
    roomName: text("room_name").notNull(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
    action: text("action").notNull(),
    target: text("target"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const whiteboard = pgTable("whiteboard", {
    userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
    fileUrl: text("file_url").notNull(),
    canvasData: text("canvas_data").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.userId, table.fileUrl] })
    };
});
