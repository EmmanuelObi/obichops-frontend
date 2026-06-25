import { redirect } from "next/navigation";

import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const workspaceId = session.user.workspaceId ?? null;

  if (role === "SUPER_ADMIN" && !workspaceId) {
    redirect("/platform/workspaces");
  }

  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    redirect("/admin");
  }

  redirect("/staff");
}
