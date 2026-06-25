import { DateTime } from "luxon";
import { CheckCircle2, Clock, Lock } from "lucide-react";

import type { MenuWeek } from "@/types/menu-week";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface OrderingWindowBannerProps {
  menuWeek: MenuWeek;
}

export function OrderingWindowBanner({ menuWeek }: OrderingWindowBannerProps) {
  const opens = DateTime.fromISO(menuWeek.orderWindowOpensAt).setZone(
    menuWeek.timezone,
  );
  const closes = DateTime.fromISO(menuWeek.orderWindowClosesAt).setZone(
    menuWeek.timezone,
  );
  const weekLabel = DateTime.fromISO(menuWeek.weekStart)
    .setZone(menuWeek.timezone)
    .toFormat("d LLL yyyy");

  if (menuWeek.windowStatus === "OPEN") {
    return (
      <Alert variant="success">
        <CheckCircle2 />
        <AlertTitle>Ordering is open</AlertTitle>
        <AlertDescription>
          Place your order for the week starting {weekLabel}. Closes{" "}
          {closes.toFormat("ccc d LLL, h:mm a")}.
        </AlertDescription>
      </Alert>
    );
  }

  if (menuWeek.windowStatus === "UPCOMING") {
    return (
      <Alert variant="warning">
        <Clock />
        <AlertTitle>Ordering opens soon</AlertTitle>
        <AlertDescription>
          {menuWeek.status === "DRAFT" ? (
            <>
              This week&apos;s menu is not open yet. Your admin can open it early
              from Menu weeks.{" "}
            </>
          ) : null}
          Opens {opens.toFormat("ccc d LLL, h:mm a")} and closes{" "}
          {closes.toFormat("ccc d LLL, h:mm a")}.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="info">
      <Lock />
      <AlertTitle>Ordering closed</AlertTitle>
      <AlertDescription>
        The ordering window for this week has ended. Contact your admin if you
        need help.
      </AlertDescription>
    </Alert>
  );
}
