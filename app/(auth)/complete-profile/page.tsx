import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { CompleteProfileForm } from "@/components/auth/complete-profile-form";

export const metadata: Metadata = {
  title: "Complete your profile",
};

export default function CompleteProfilePage() {
  return (
    <AuthCard
      title="Complete your profile"
      description="Enter your name and choose a new password. This applies to admins and staff on first sign-in."
    >
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <CompleteProfileForm />
      </Suspense>
    </AuthCard>
  );
}
