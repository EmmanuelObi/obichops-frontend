import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { hasPlatformWorkspaceContext } from "@/lib/platform-workspace-server";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const hasWorkspace = await hasPlatformWorkspaceContext(
    session.user.workspaceId,
  );

  if (role === "SUPER_ADMIN" && !hasWorkspace) {
    redirect("/platform");
  }

  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    redirect("/admin");
  }

  redirect("/staff");
}
