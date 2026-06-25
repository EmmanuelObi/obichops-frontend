import { NextResponse } from "next/server";

import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;
  const workspaceId = session?.user?.workspaceId ?? null;
  const mustChangePassword = session?.user?.mustChangePassword;
  const needsProfileCompletion = session?.user?.needsProfileCompletion;
  const isPlatformOnlySuperAdmin = role === "SUPER_ADMIN" && !workspaceId;

  const isAdminRoute = pathname.startsWith("/admin");
  const isPlatformRoute = pathname.startsWith("/platform");
  const isStaffRoute = pathname.startsWith("/staff");
  const isChangePasswordRoute = pathname === "/change-password";
  const isProtectedRoute = isAdminRoute || isPlatformRoute || isStaffRoute;

  if (isChangePasswordRoute) {
    if (!session) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (mustChangePassword || needsProfileCompletion) {
    return NextResponse.redirect(new URL("/change-password", req.nextUrl.origin));
  }

  if (isPlatformOnlySuperAdmin && (isAdminRoute || isStaffRoute)) {
    return NextResponse.redirect(
      new URL("/platform/workspaces", req.nextUrl.origin),
    );
  }

  if (isPlatformRoute && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
  }

  if (isAdminRoute && role === "STAFF") {
    return NextResponse.redirect(new URL("/staff", req.nextUrl.origin));
  }

  if (isAdminRoute && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  if (isStaffRoute && role === "ADMIN" && pathname.startsWith("/staff/orders")) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
  }

  if (isStaffRoute && role !== "STAFF" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/platform/:path*", "/staff/:path*", "/change-password"],
};
