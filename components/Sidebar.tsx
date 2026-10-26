"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  BellRing,
  BookOpenText,
  Building2,
  DoorOpen,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import { accessRoleOf, activeNavHref, navItemsFor, type NavIconKey } from "@/lib/access";
import { needsReview } from "@/lib/alert-presentation";
import { useAlerts } from "@/lib/AlertsProvider";
import { useSchoolScope } from "@/lib/school-scope";
import { formatTime } from "@/lib/format";

const SIDEBAR_STORAGE_KEY = "echosense.sidebar.collapsed.v3";

const NAV_ICONS: Record<NavIconKey, LucideIcon> = {
  overview: Home,
  alerts: BellRing,
  reports: BarChart3,
  classrooms: DoorOpen,
  people: Users,
  activity: Activity,
  settings: Settings,
  schools: Building2,
  words: BookOpenText,
};

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function useNavItems() {
  const user = useCurrentUser();
  const scope = useSchoolScope();
  const role = accessRoleOf(user);
  const mode = role === "super_admin" && !scope ? "platform" : "school";
  return { items: user ? navItemsFor(role, mode) : [], mode };
}

function ConnectionLine({ collapsed }: { collapsed: boolean }) {
  const { online, loading, lastUpdated } = useAlerts();
  if (loading) return null;
  const label = online
    ? `Live${lastUpdated ? ` · updated ${formatTime(lastUpdated)}` : ""}`
    : "Can't reach EchoSense · retrying";
  return (
    <p
      role="status"
      title={collapsed ? label : undefined}
      className={`flex items-center gap-2 px-3 py-3 text-small ${online ? "text-muted" : "font-medium text-danger"} ${
        collapsed ? "justify-center" : ""
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 shrink-0 rounded-full ${online ? "bg-muted" : "bg-danger"}`}
      />
      <span className={collapsed ? "sr-only" : "num truncate"}>{label}</span>
    </p>
  );
}

function NavList({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { items } = useNavItems();
  const { alerts } = useAlerts();
  const reviewCount = alerts.filter(needsReview).length;
  const active = activeNavHref(items, pathname);

  return (
    <ul className="space-y-0.5">
      {items.map(({ href, icon, label }) => {
        const Icon = NAV_ICONS[icon];
        const isActive = href === active;
        const count = href === "/alerts" && reviewCount > 0 ? reviewCount : null;
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              aria-label={collapsed ? (count ? `${label}, ${count} need review` : label) : undefined}
              title={collapsed ? label : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-control px-3 text-body font-medium transition-colors ${
                collapsed ? "justify-center" : ""
              } ${isActive ? "bg-brand text-brand-ink" : "text-ink hover:bg-bg"}`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
              {!collapsed && count !== null && (
                <span
                  className={`num rounded-tag px-1.5 text-small ${isActive ? "bg-brand-ink text-brand" : "bg-ink text-bg"}`}
                  aria-label={`${count} need review`}
                >
                  {count}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Wordmark({ collapsed = false, href }: { collapsed?: boolean; href: string }) {
  return (
    <Link href={href} className="flex min-h-11 items-center gap-2.5 rounded-control px-1 text-ink">
      <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-hidden="true">
        <rect width="24" height="24" rx="6" fill="var(--brand)" />
        <path d="M7 9v6M10.5 7v10M14 9.5v5M17.5 11v2" stroke="var(--brand-ink)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className={collapsed ? "sr-only" : "text-body-lg font-semibold"}>EchoSense</span>
    </Link>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { mode } = useNavItems();

  useEffect(() => {
    const timer = setTimeout(() => setCollapsed(readCollapsed()), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onMobileClose();
      if (event.key !== "Tab") return;
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [mobileOpen, onMobileClose]);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(!value));
      } catch {
        // Preference lasts for this page only.
      }
      return !value;
    });
  };

  const navLabel = mode === "platform" ? "Platform" : "School";
  const homeHref = mode === "platform" ? "/schools" : "/overview";

  return (
    <>
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface md:flex ${
          collapsed ? "w-[72px]" : "w-60"
        }`}
      >
        <div className={`flex h-14 items-center px-3 ${collapsed ? "justify-center" : ""}`}>
          <Wordmark collapsed={collapsed} href={homeHref} />
        </div>
        <nav aria-label={navLabel} className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          <NavList collapsed={collapsed} />
        </nav>
        <div className="border-t border-line">
          <ConnectionLine collapsed={collapsed} />
          <div className="px-3 pb-3">
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-expanded={!collapsed}
              className={`flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-body text-muted hover:bg-bg hover:text-ink ${
                collapsed ? "justify-center" : ""
              }`}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-[18px] w-[18px]" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="h-[18px] w-[18px]" aria-hidden="true" />
              )}
              <span className={collapsed ? "sr-only" : ""}>{collapsed ? "Expand menu" : "Collapse menu"}</span>
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} aria-hidden="true" />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="animate-pop-in relative z-10 flex w-72 max-w-[85vw] flex-col border-r border-line bg-surface"
          >
            <div className="flex h-14 items-center justify-between px-3">
              <Wordmark href={homeHref} />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onMobileClose}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-ink"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav aria-label={navLabel} className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              <NavList collapsed={false} onNavigate={onMobileClose} />
            </nav>
            <div className="border-t border-line">
              <ConnectionLine collapsed={false} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
