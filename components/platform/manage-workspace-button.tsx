"use client";

import { Settings2 } from "lucide-react";

import { usePlatformWorkspace } from "@/hooks/use-platform-workspace";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ManageWorkspaceButtonProps {
  chopspace: {
    id: string;
    name: string;
    slug: string;
  };
  variant?: "default" | "outline" | "premium";
  size?: "default" | "sm" | "lg";
  className?: string;
  asLinkStyle?: boolean;
}

export function ManageWorkspaceButton({
  chopspace,
  variant = "outline",
  size = "sm",
  className,
  asLinkStyle = false,
}: ManageWorkspaceButtonProps) {
  const { enterWorkspace } = usePlatformWorkspace();

  const content = (
    <>
      <Settings2 className="size-4" />
      Manage
    </>
  );

  if (asLinkStyle) {
    return (
      <button
        type="button"
        className={cn(buttonVariants({ variant, size }), className)}
        onClick={() =>
          enterWorkspace({
            id: chopspace.id,
            name: chopspace.name,
            slug: chopspace.slug,
          })
        }
      >
        {content}
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() =>
        enterWorkspace({
          id: chopspace.id,
          name: chopspace.name,
          slug: chopspace.slug,
        })
      }
    >
      {content}
    </Button>
  );
}
