export type Role = "SUPER_ADMIN" | "ADMIN" | "STAFF";

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  role: Role;
  workspaceId?: string | null;
  workspaceSlug?: string | null;
  workspaceName?: string | null;
  isActive?: boolean;
  mustChangePassword?: boolean;
  needsProfileCompletion?: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface AllowedEmail {
  id: string;
  email: string;
  role: "ADMIN" | "STAFF";
  workspaceId: string;
  isActive: boolean;
  createdAt?: string;
}

export interface Workspace {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt?: string;
}
