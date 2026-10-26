"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BellRing,
  FileClock,
  BarChart3,
  Settings,
  ChevronLeft,
  X,
  Users,
  HeartPulse,
  BookOpen,
  ClipboardList,
  Grid3X3,
  UserRoundCheck,
  UserRound,
  Terminal,
  DoorOpen,
  Cpu,
  Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import { accessRoleOf, navSectionsFor, type NavIconKey } from "@/lib/access";

const SIDEBAR_STORAGE_KEY = "echosense.sidebar.collapsed.v2";

const NAV_ICONS: Record<NavIconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  alerts: BellRing,
  history: FileClock,
  settings: Settings,
  profile: UserRound,
  counselor: UserRoundCheck,
  reports: BarChart3,
  classrooms: DoorOpen,
  devices: Cpu,
  users: Users,
  heartbeat: HeartPulse,
  dictionary: BookOpen,
  audit: ClipboardList,
  logs: Terminal,
  heatmap: Grid3X3,
  schools: Building2,
};

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

type NavSection = {
  label?: string;
  items: NavItem[];
};

// Extracted OUTSIDE Sidebar to avoid "component defined during render" lint rule
interface NavContentProps {
  collapsed: boolean;
  pathname: string;
  showCollapseToggle: boolean;
  onToggleCollapsed: () => void;
  onLinkClick?: () => void;
  navSections: NavSection[];
}

function NavContent({
  collapsed,
  pathname,
  showCollapseToggle,
  onToggleCollapsed,
  onLinkClick,
  navSections,
}: NavContentProps) {
  return (
    <div
      className={`flex h-full min-h-0 flex-col transition-[width] duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div
        className={`flex min-h-16 shrink-0 items-center border-b border-line px-3  ${
          collapsed ? "justify-center" : "justify-between gap-3"
        }`}
      >
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">
              Navigation
            </p>
            <p className="text-xs text-muted">
              EchoSense menu
            </p>
          </div>
        )}
        {showCollapseToggle && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-expanded={!collapsed}
            aria-controls="desktop-primary-navigation"
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={`h-5 w-5 transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
            <span className="sr-only">
              {collapsed ? "Expand sidebar and show names" : "Collapse sidebar"}
            </span>
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav
        id={showCollapseToggle ? "desktop-primary-navigation" : undefined}
        aria-label="Primary navigation"
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2 py-3"
      >
        {navSections.map((section, sectionIndex) => (
          <div key={section.label ?? `primary-${sectionIndex}`} className="space-y-0.5">
            {section.label && !collapsed && (
              <p className="px-3 pb-1.5 text-[10px] font-semibold text-muted">
                {section.label}
              </p>
            )}
            {section.items.map(({ href, icon: Icon, label }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onLinkClick}
                  aria-label={collapsed ? label : undefined}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? label : undefined}
                  className={`group relative flex min-h-11 items-center gap-3 rounded-control px-3 py-2.5 transition-all duration-150 focus-visible:outline-none   ${
                    active
                      ? "bg-indigo-500/10  text-ink"
                      : "text-muted hover:bg-surface  hover:text-ink "
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                  )}
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      active ? "text-link" : ""
                    }`}
                    aria-hidden="true"
                  />
                  {!collapsed && (
                    <span className="min-w-0 text-sm font-medium">{label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const user = useCurrentUser();
  // Until /auth/me answers, show nothing role-specific rather than guessing.
  const navSections: NavSection[] = user
    ? navSectionsFor(accessRoleOf(user)).map((section) => ({
        label: section.label,
        items: section.items.map((item) => ({ ...item, icon: NAV_ICONS[item.icon] })),
      }))
    : [];

  // Read localStorage after mount — use setTimeout to avoid setState-in-effect lint
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    const next = stored === "true";
    const timer = setTimeout(() => setCollapsed(next), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onMobileClose();
      if (event.key !== "Tab") return;
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
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
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  const handleToggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-full shrink-0 overflow-hidden border-r border-line bg-bg md:flex">
        <NavContent
          collapsed={collapsed}
          pathname={pathname}
          showCollapseToggle
          onToggleCollapsed={handleToggleCollapsed}
          navSections={navSections}
        />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/60"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="relative z-10 w-64 bg-bg border-r border-line flex flex-col overflow-y-auto"
            style={{ animation: "slide-in-top 250ms ease-out" }}
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onMobileClose}
              className="absolute right-3 top-3 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <NavContent
              collapsed={false}
              pathname={pathname}
              showCollapseToggle={false}
              onToggleCollapsed={handleToggleCollapsed}
              onLinkClick={onMobileClose}
              navSections={navSections}
            />
          </aside>
        </div>
      )}
    </>
  );
}
