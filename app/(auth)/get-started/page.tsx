import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { GetStartedForm } from "@/components/onboarding/get-started-form";

export const metadata: Metadata = {
  title: "Get started",
};

export default function GetStartedPage() {
  return (
    <AuthCard
      title="Set up your chopspace"
      description="Tell us about your business. Once our team approves your request, you'll receive admin sign-in details by email."
    >
      <GetStartedForm />
    </AuthCard>
  );
}
