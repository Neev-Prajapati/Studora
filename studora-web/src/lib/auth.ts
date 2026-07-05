import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import nodemailer from "nodemailer";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        // sendVerificationEmail moved to root emailVerification config
        sendResetPassword: async ({ user, url, token }: any) => {
            if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
                console.warn("SMTP credentials not found in environment variables. Falling back to console logging.");
                console.log("\n\n=== PASSWORD RESET REQUEST ===");
                console.log(`User: ${user.email}`);
                console.log(`Reset URL: ${url}`);
                console.log("===============================\n\n");
                return;
            }

            try {
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });

                await transporter.sendMail({
                    from: `"Studora" <${process.env.SMTP_USER}>`,
                    to: user.email,
                    subject: "Reset your Studora password",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #333;">Reset Your Password</h2>
                            <p>Hi ${user.name},</p>
                            <p>We received a request to reset your password for your Studora account.</p>
                            <p>Click the button below to set a new password:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${url}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
                            </div>
                            <p style="font-size: 14px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                            <p style="font-size: 12px; color: #999;">Studora Team</p>
                        </div>
                    `,
                });
                console.log(`Password reset email sent to ${user.email}`);
            } catch (error) {
                console.error("Failed to send password reset email:", error);
            }
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        sendVerificationEmail: async ({ user, url, token }: any) => {
            if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
                console.warn("SMTP credentials not found in environment variables. Falling back to console logging.");
                console.log("\n\n=== EMAIL VERIFICATION REQUEST ===");
                console.log(`User: ${user.email}`);
                console.log(`Verification URL: ${url}`);
                console.log("===============================\n\n");
                return;
            }

            try {
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });

                await transporter.sendMail({
                    from: `"Studora" <${process.env.SMTP_USER}>`,
                    to: user.email,
                    subject: "Verify your Studora email",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #333;">Welcome to Studora!</h2>
                            <p>Hi ${user.name},</p>
                            <p>Please verify your email address by clicking the button below:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${url}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email</a>
                            </div>
                            <p style="font-size: 14px; color: #666;">If you didn't create an account, you can safely ignore this email.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                            <p style="font-size: 12px; color: #999;">Studora Team</p>
                        </div>
                    `,
                });
                console.log(`Verification email sent to ${user.email}`);
            } catch (error) {
                console.error("Failed to send verification email:", error);
            }
        },
    },
    user: {
        additionalFields: {
            username: {
                type: "string",
                required: false,
            }
        }
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }
    },
});
