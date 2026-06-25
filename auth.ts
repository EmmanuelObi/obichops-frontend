import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { apiFetch } from "@/lib/api-client";
import type { AuthResponse } from "@/types/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        try {
          const data = await apiFetch<AuthResponse>("/auth/login", {
            method: "POST",
            json: { email, password },
          });

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name ?? data.user.email,
            firstName: data.user.firstName ?? null,
            lastName: data.user.lastName ?? null,
            role: data.user.role,
            workspaceId: data.user.workspaceId ?? null,
            workspaceSlug: data.user.workspaceSlug ?? null,
            workspaceName: data.user.workspaceName ?? null,
            mustChangePassword: data.user.mustChangePassword ?? false,
            needsProfileCompletion: data.user.needsProfileCompletion ?? false,
            accessToken: data.token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.workspaceId = user.workspaceId ?? null;
        token.workspaceSlug = user.workspaceSlug ?? null;
        token.workspaceName = user.workspaceName ?? null;
        token.firstName = user.firstName ?? null;
        token.lastName = user.lastName ?? null;
        token.mustChangePassword = user.mustChangePassword ?? false;
        token.needsProfileCompletion = user.needsProfileCompletion ?? false;
        token.accessToken = user.accessToken;
        if (user.name) token.name = user.name;
      }

      if (
        token.workspaceId &&
        !token.workspaceName &&
        token.workspaceSlug &&
        typeof token.workspaceSlug === "string"
      ) {
        token.workspaceName = token.workspaceSlug
          .split(/[-_]/)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as typeof session.user.role;
        session.user.workspaceId = (token.workspaceId as string | null) ?? null;
        session.user.workspaceSlug = (token.workspaceSlug as string | null) ?? null;
        session.user.workspaceName = (token.workspaceName as string | null) ?? null;
        session.user.firstName = (token.firstName as string | null) ?? null;
        session.user.lastName = (token.lastName as string | null) ?? null;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
        session.user.needsProfileCompletion = Boolean(token.needsProfileCompletion);
        if (token.name) session.user.name = token.name as string;
      }
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
  },
});
