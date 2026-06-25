import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <AppShell
      role={session?.user?.role}
      email={session?.user?.email}
      name={session?.user?.name}
    >
      {children}
    </AppShell>
  );
}
