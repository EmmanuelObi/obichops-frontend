"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    setVisible(true);
    setProgress(12);

    timersRef.current.push(
      setTimeout(() => setProgress(45), 80),
      setTimeout(() => setProgress(78), 220),
      setTimeout(() => setProgress(100), 420),
      setTimeout(() => setVisible(false), 620),
    );

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [pathname]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 bg-transparent"
      aria-hidden
    >
      <div
        className="h-full bg-gold shadow-[0_0_12px_hsl(var(--gold)/0.45)] transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
