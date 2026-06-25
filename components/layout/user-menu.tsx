"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { KeyRound, LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { roleLabel } from "@/lib/labels";
import type { Role } from "@/types/auth";

interface UserMenuProps {
  email?: string | null;
  name?: string | null;
  role?: Role;
}

function initials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return (email?.[0] ?? "?").toUpperCase();
}

export function UserMenu({ email, name, role }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="relative size-9 rounded-full p-0">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {initials(name, email)}
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium leading-none">
                {name ?? email ?? "Account"}
              </p>
              {email ? (
                <p className="text-xs text-muted-foreground">{email}</p>
              ) : null}
              {role ? (
                <p className="text-xs text-muted-foreground">{roleLabel(role)}</p>
              ) : null}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            render={
              <Link href="/change-password" className="flex items-center gap-2">
                <KeyRound className="size-4" />
                Change password
              </Link>
            }
          />
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => void signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
