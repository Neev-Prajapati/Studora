"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmail } from "@/lib/auth-client";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token provided.");
      return;
    }

    let isMounted = true;

    const verifyToken = async () => {
      try {
        const { error } = await verifyEmail({
          query: {
            token: token,
          },
        });

        if (!isMounted) return;

        if (error) {
          setStatus("error");
          setErrorMessage(error.message || "Failed to verify email. The link may have expired.");
        } else {
          setStatus("success");
        }
      } catch (err: any) {
        if (!isMounted) return;
        setStatus("error");
        setErrorMessage("An unexpected error occurred during verification.");
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token, router]);

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
      {status === "loading" && (
        <div className="flex flex-col items-center">
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Verifying your email...</h2>
          <p className="mt-2 text-muted-foreground">Please wait a moment.</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Email Verified!</h2>
          <p className="mt-2 text-muted-foreground mb-6">
            Your account has been successfully verified. You can now sign in to your account.
          </p>
          <Link
            href="/login"
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center">
          <XCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Verification Failed</h2>
          <p className="mt-2 text-muted-foreground mb-6">
            {errorMessage}
          </p>
          <Link
            href="/login"
            className="w-full flex justify-center items-center py-2.5 px-4 border border-border rounded-md shadow-sm bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Back to Login
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center">
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Loading...</h2>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
