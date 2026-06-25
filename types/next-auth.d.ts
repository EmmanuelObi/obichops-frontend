import type { DefaultSession } from "next-auth";
import type { Role } from "@/types/auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      role: Role;
      workspaceId?: string | null;
      workspaceSlug?: string | null;
      workspaceName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      mustChangePassword?: boolean;
      needsProfileCompletion?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
    workspaceId?: string | null;
    workspaceSlug?: string | null;
    workspaceName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    mustChangePassword?: boolean;
    needsProfileCompletion?: boolean;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    role?: Role;
    workspaceId?: string | null;
    workspaceSlug?: string | null;
    workspaceName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    mustChangePassword?: boolean;
    needsProfileCompletion?: boolean;
    id?: string;
  }
}
