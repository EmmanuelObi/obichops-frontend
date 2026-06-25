import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <AuthCard
        title="Sign in"
        description="Use your work email and the password from your invite."
      >
        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
        >
          <LoginForm />
        </Suspense>
      </AuthCard>
  );
}
