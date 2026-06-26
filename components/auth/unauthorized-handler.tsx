"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

import {
  clearUnauthorizedHandler,
  registerUnauthorizedHandler,
} from "@/lib/unauthorized-handler";

export function UnauthorizedHandler() {
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      toast.error("Your session has expired. Please sign in again.");
      void signOut({ callbackUrl: "/login" });
    });

    return () => {
      clearUnauthorizedHandler();
    };
  }, []);

  return null;
}
