import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <AuthCard
        title="Create account"
        description="Most staff are invited by an admin. If you received a temporary password, sign in instead."
      >
        <RegisterForm />
      </AuthCard>
  );
}
