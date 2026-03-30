"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Baby,
  FileEdit,
  BarChart3,
  LogOut,
  ChevronRight,
  Users,
  ShieldCheck,
  Search,
  ClipboardList,
  UserCircle,
  CalendarCheck,
  FolderOpen,
  Stethoscope,
  Scale,
  Award,
  Building2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavChild {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavChild[];
}

const staffNavItems: NavItem[] = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Kids", href: "/kids", icon: Baby },
  {
    label: "Requests",
    href: "/requests",
    icon: FileEdit,
    children: [
      { label: "Proposals", href: "/requests/proposals" },
      { label: "Home Visits", href: "/requests/home-visits" },
      { label: "Approvals", href: "/requests/approvals" },
    ],
  },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

const adminNavItems: NavItem[] = [
  { label: "Staff", href: "/staff", icon: Users },
];

const parentNavItems: NavItem[] = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Browse Children", href: "/explore", icon: Search },
  { label: "My Applications", href: "/my-applications", icon: ClipboardList },
  { label: "My Reports", href: "/my-reports", icon: BarChart3 },
];

const socialWorkerNavItems: NavItem[] = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Cases", href: "/requests", icon: FolderOpen },
  { label: "Home Visits", href: "/home-visits", icon: CalendarCheck },
  { label: "Children", href: "/kids", icon: Baby },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

const dcNavItems: NavItem[] = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Requests", href: "/requests", icon: Scale },
  { label: "Kids", href: "/kids", icon: Baby },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

const ncdaNavItems: NavItem[] = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Requests", href: "/requests", icon: Award },
  { label: "Kids", href: "/kids", icon: Baby },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

const orphanageNavItems: NavItem[] = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Children", href: "/kids", icon: Baby },
  { label: "Proposals", href: "/requests", icon: ClipboardList },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const isAdmin = user?.role === "system_admin";
  const isParent = user?.role === "adoptive_family";
  const isSocialWorker = user?.role === "social_worker";
  const isDC = user?.role === "district_commissioner";
  const isNcda = user?.role === "ncda_official";
  const isOrphanageAdmin = user?.role === "orphanage_admin";

  const navItems = isParent
    ? parentNavItems
    : isSocialWorker
    ? socialWorkerNavItems
    : isDC
    ? dcNavItems
    : isNcda
    ? ncdaNavItems
    : isOrphanageAdmin
    ? orphanageNavItems
    : isAdmin
    ? [...staffNavItems, ...adminNavItems]
    : staffNavItems;

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Link href="/overview" className="text-2xl font-bold italic text-primary">
          KidSafe
        </Link>
      </div>

      {/* Role badge */}
      {isAdmin && (
        <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary">System Admin</span>
        </div>
      )}
      {isParent && (
        <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
          <UserCircle className="h-4 w-4 text-green-600" />
          <span className="text-xs font-semibold text-green-700">Adoptive Family</span>
        </div>
      )}
      {isSocialWorker && (
        <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
          <Stethoscope className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-semibold text-blue-700">Social Worker</span>
        </div>
      )}
      {isDC && (
        <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg">
          <Scale className="h-4 w-4 text-orange-600" />
          <span className="text-xs font-semibold text-orange-700">District Commissioner</span>
        </div>
      )}
      {isNcda && (
        <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg">
          <Award className="h-4 w-4 text-indigo-600" />
          <span className="text-xs font-semibold text-indigo-700">NCDA Official</span>
        </div>
      )}
      {isOrphanageAdmin && (
        <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 bg-pink-50 rounded-lg">
          <Building2 className="h-4 w-4 text-pink-600" />
          <span className="text-xs font-semibold text-pink-700">Orphanage Admin</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const isExpanded = expandedItems.includes(item.label);
          const Icon = item.icon;

          return (
            <div key={item.label}>
              <div className="relative">
                {isActive && (
                  <div className="absolute left-0 top-1 bottom-1 w-1 rounded-r-full bg-primary" />
                )}
                {item.children ? (
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>

              {item.children && isExpanded && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block rounded-lg px-4 py-2 text-sm transition-colors",
                          isChildActive
                            ? "text-primary font-medium"
                            : "text-sidebar-foreground hover:text-primary"
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div className="border-t border-border p-3 space-y-1">
        {user && (
          <Link
            href="/my-profile"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-[#6c63ff]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-[#6c63ff]">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </Link>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
