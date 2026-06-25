import Image from "next/image";
import type { ReactNode } from "react";

const LOGO_SRC = "/assets/White%20Logo.png";

const logoFrameClass =
  "rounded-full object-cover ring-2 ring-gold/35 shadow-premium-lg";

function AuthBrandPanel() {
  return (
    <>
      <Image
        src={LOGO_SRC}
        alt="Obi's Chops"
        width={320}
        height={320}
        className={`h-auto w-56 xl:w-64 ${logoFrameClass}`}
        priority
      />

      <div className="premium-gold-line mt-10 w-20" aria-hidden />

      <h1 className="auth-display mt-8 max-w-sm text-primary-foreground">
        Weekly team meals,
        <br />
        <span className="text-gold">simplified.</span>
      </h1>

      <div className="auth-subdisplay mt-6 max-w-sm space-y-3 text-primary-foreground/75">
        <p>
          Browse the menu, stay within budget, and submit your order before the
          window closes.
        </p>
        <p className="text-primary-foreground/55">
          Admins manage vendors, weeks, and team access — all in one place.
        </p>
      </div>
    </>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0 marketing-grid opacity-[0.12]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,hsl(var(--gold)/0.12),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        <div className="relative flex flex-1 flex-col items-center justify-center px-10 py-16">
          <div className="hero-stagger flex w-full max-w-md flex-col items-center text-center">
            <AuthBrandPanel />
          </div>
        </div>

        <p className="relative px-10 pb-10 text-center text-sm tracking-wide text-primary-foreground/50">
          Built for teams who eat well together.
        </p>
      </div>

      <div className="premium-surface flex flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 flex justify-center lg:hidden">
          <Image
            src={LOGO_SRC}
            alt="Obi's Chops"
            width={280}
            height={280}
            className={`h-auto w-44 sm:w-52 ${logoFrameClass}`}
            priority
          />
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
