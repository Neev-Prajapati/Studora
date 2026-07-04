import { createAuthClient } from "better-auth/react"
export const authClient =  createAuthClient({
    // Add client-side configuration if needed here
})

export const { signIn, signOut, useSession } = authClient;
