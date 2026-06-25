import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <Card className={cn("w-full border-border/70 shadow-premium")}>
      <CardHeader className="space-y-2">
        <CardTitle className="font-serif text-2xl font-semibold tracking-tight">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="leading-relaxed">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
