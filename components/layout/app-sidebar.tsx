"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { roleLabel } from "@/lib/labels";
import { useWorkspaceBrand } from "@/hooks/use-workspace-brand";
import type { Role } from "@/types/auth";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

const adminNav: NavItem[] = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["ADMIN"],
  },
  {
    title: "Menu weeks",
    href: "/admin/weeks",
    icon: CalendarDays,
    roles: ["ADMIN"],
  },
  {
    title: "Vendors",
    href: "/admin/vendors",
    icon: Store,
    roles: ["ADMIN"],
  },
  {
    title: "Team",
    href: "/admin/allowed-emails",
    icon: Users,
    roles: ["ADMIN"],
  },
];

const staffNav: NavItem[] = [
  {
    title: "This week",
    href: "/staff",
    icon: ShoppingBag,
    roles: ["STAFF", "ADMIN"],
  },
  {
    title: "My orders",
    href: "/staff/orders",
    icon: ClipboardList,
    roles: ["STAFF"],
  },
];

const platformNav: NavItem[] = [
  {
    title: "Workspaces",
    href: "/platform/workspaces",
    icon: Building2,
    roles: ["SUPER_ADMIN"],
  },
];

interface AppSidebarProps {
  role?: Role;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin" || href === "/staff") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname();
  const { displayName, hasWorkspace } = useWorkspaceBrand();
  const isStaffOnly = role === "STAFF";
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";
  const homeHref = isSuperAdmin
    ? "/platform/workspaces"
    : isStaffOnly
      ? "/staff"
      : "/admin";

  const brandTitle = displayName;
  const brandSubtitle = hasWorkspace
    ? role
      ? roleLabel(role)
      : "Workspace"
    : role
      ? roleLabel(role)
      : "Platform";

  const visibleAdminNav = adminNav.filter((item) =>
    role ? item.roles.includes(role) : false,
  );
  const visibleStaffNav = staffNav.filter((item) =>
    role ? item.roles.includes(role) : false,
  );
  const visiblePlatformNav = platformNav.filter((item) =>
    role ? item.roles.includes(role) : false,
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <Link href={homeHref} className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg border border-gold/25 bg-primary text-primary-foreground shadow-premium">
                    <ShoppingBag className="size-4" strokeWidth={1.75} />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">{brandTitle}</span>
                    <span className="text-xs text-muted-foreground">
                      {brandSubtitle}
                    </span>
                  </div>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {isStaffOnly ? (
          <SidebarGroup>
            <SidebarGroupLabel>Ordering</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleStaffNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(pathname, item.href)}
                      render={
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {isAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdminNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(pathname, item.href)}
                      render={
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {isAdmin ? (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Ordering</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleStaffNav.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive(pathname, item.href)}
                        render={
                          <Link href={item.href}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : null}

        {isSuperAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visiblePlatformNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(pathname, item.href)}
                      render={
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <p className="px-2 pb-1 text-xs leading-relaxed text-muted-foreground group-data-[collapsible=icon]:hidden">
              Weekly team meals, simplified.
            </p>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => void signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="size-4" strokeWidth={1.75} />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
