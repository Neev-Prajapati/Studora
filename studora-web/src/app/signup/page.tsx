"use client";

import { BookOpen } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { useState } from "react";

export default function SignUp() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignup = async () => {
    setLoading(true);
    await signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <BookOpen className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Join Studora Today
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Create an account to start managing your academic life.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-border rounded-md shadow-sm bg-background text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50"
          >
            {loading ? "Redirecting..." : "Sign up with Google"}
          </button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-primary hover:text-primary/80">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
