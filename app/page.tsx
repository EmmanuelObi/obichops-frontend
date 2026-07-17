import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, CircleDollarSign, Utensils } from "lucide-react";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { RETURNING_VISITOR_COOKIE } from "@/lib/returning-visitor";
import { cn } from "@/lib/utils";
import { hasPlatformWorkspaceContext } from "@/lib/platform-workspace-server";

export const metadata: Metadata = {
  title: "Workplace meals, made simple",
  description:
    "Plan weekly workplace meals, manage allowances, and keep every order organised with Obi's Chops.",
};

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
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

  const jar = await cookies();
  if (jar.get(RETURNING_VISITOR_COOKIE)?.value === "1") {
    redirect("/login");
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-background">
      <div className="marketing-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-136 w-136 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative mx-auto flex h-dvh w-full max-w-7xl flex-col px-5 sm:px-8 lg:px-12">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 sm:h-20">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Obi's Chops home"
          >
            <Image
              src="/assets/brand-logo.png"
              alt=""
              width={42}
              height={42}
              priority
              className="rounded-xl"
            />
            <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
              Obi&apos;s Chops
            </span>
          </Link>

          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Sign in
          </Link>
        </header>

        <section className="grid min-h-0 flex-1 items-center gap-8 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-8">
          <div className="hero-stagger max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-primary uppercase">
              Weekly workplace meals
            </p>
            <h1 className="font-serif text-4xl leading-[1.05] font-semibold tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
              Good food.
              <br />
              <span className="text-primary">Zero confusion.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-foreground/70 sm:text-lg sm:leading-8">
              Browse the weekly menu, stay within your allowance, and place your
              order before the window closes - all in one calm, simple chopspace.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                href="/get-started"
                className={cn(buttonVariants({ variant: "premium", size: "lg" }))}
              >
                Get started
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Sign in to your chopspace
              </Link>
            </div>
            <p className="mt-4 text-sm text-foreground/55">
              Staff access is provided by your workplace admin.
            </p>
          </div>

          <div className="relative mx-auto hidden w-full max-w-xl lg:block">
            <div className="absolute inset-8 rounded-[2.5rem] bg-primary/10 blur-3xl" />
            <div className="premium-panel relative overflow-hidden rounded-4xl p-3 sm:p-4">
              <div className="rounded-3xl bg-primary p-7 text-primary-foreground sm:p-9">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.12em] text-primary-foreground/70 uppercase">
                      This week
                    </p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-primary-foreground">
                      Lunch, sorted.
                    </h2>
                  </div>
                  <Image
                    src="/assets/brand-logo.png"
                    alt=""
                    width={82}
                    height={82}
                    className="rounded-2xl"
                  />
                </div>

                <div className="mt-10 grid gap-3 sm:grid-cols-3">
                  <Feature
                    icon={<Utensils />}
                    title="Choose"
                    text="Browse each day's menu."
                  />
                  <Feature
                    icon={<CircleDollarSign />}
                    title="Track"
                    text="See your allowance clearly."
                  />
                  <Feature
                    icon={<CalendarDays />}
                    title="Submit"
                    text="Order before the deadline."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex shrink-0 flex-col gap-2 border-t border-border/60 py-5 text-sm text-foreground/55 sm:flex-row sm:items-center sm:justify-between sm:py-6">
          <p>© {new Date().getFullYear()} Obi&apos;s Chops.</p>
          <p>Workplace meals, organised.</p>
        </footer>
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 p-4">
      <div className="mb-4 flex size-9 items-center justify-center rounded-lg bg-white/15 text-primary-foreground [&_svg]:size-4">
        {icon}
      </div>
      <h3 className="font-semibold text-primary-foreground">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-primary-foreground/75">{text}</p>
    </div>
  );
}
