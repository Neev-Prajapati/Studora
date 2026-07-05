import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    // Add client-side configuration if needed here
})

// @ts-ignore
export const { signIn, signUp, signOut, useSession, forgetPassword, resetPassword, requestPasswordReset } = authClient;
