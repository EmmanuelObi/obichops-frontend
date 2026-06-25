import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export const metadata: Metadata = {
  title: "Complete your profile",
};

export default function ChangePasswordPage() {
  return (
    <AuthCard
      title="Complete your profile"
      description="Enter your name and choose a new password. This applies to admins and staff on first sign-in."
    >
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <ChangePasswordForm />
      </Suspense>
    </AuthCard>
  );
}
