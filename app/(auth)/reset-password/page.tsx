import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Reset password" description="Choose a new password.">
        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
        >
          <ResetPasswordForm />
        </Suspense>
      </AuthCard>
  );
}
