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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";

const SIDEBAR_STORAGE_KEY = "echosense.sidebar.collapsed.v2";

const BASE_NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/alerts",    icon: BellRing,        label: "Alerts" },
  { href: "/logs",      icon: FileClock,       label: "History" },
  { href: "/settings",  icon: Settings,        label: "Settings" },
  { href: "/profile",   icon: UserRound,       label: "Profile" },
];

const ADMIN_NAV_ITEMS = [
  { href: "/users",            icon: Users,         label: "User Accounts" },
  { href: "/admin/heartbeat",  icon: HeartPulse,    label: "Device Status" },
  { href: "/admin/dictionary", icon: BookOpen,      label: "Monitored Terms" },
  { href: "/admin/audit",      icon: ClipboardList, label: "Audit History" },
  { href: "/admin/logs",       icon: Terminal,      label: "Technical Logs" },
  { href: "/admin/heatmap",    icon: Grid3X3,       label: "Classroom Area Map" },
];

const COUNSELOR_NAV_ITEMS = [
  { href: "/counselor", icon: UserRoundCheck, label: "Counselor Overview" },
  { href: "/analytics", icon: BarChart3, label: "Reports and Trends" },
];

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
        className={`flex min-h-16 shrink-0 items-center border-b border-slate-200 px-3 dark:border-slate-800 ${
          collapsed ? "justify-center" : "justify-between gap-3"
        }`}
      >
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-950 dark:text-white">
              Navigation
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
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
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
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
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
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
                  className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                    active
                      ? "bg-indigo-500/10 dark:bg-white/10 text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                  )}
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      active ? "text-indigo-400" : ""
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
  const navSections: NavSection[] = [
    { items: BASE_NAV_ITEMS },
    ...(user?.role === "admin" || user?.role === "counselor"
      ? [{ label: "Guidance", items: COUNSELOR_NAV_ITEMS }]
      : []),
    ...(user?.role === "admin"
      ? [{ label: "Admin", items: ADMIN_NAV_ITEMS }]
      : []),
  ];

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
      <aside className="hidden h-full shrink-0 overflow-hidden border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:flex">
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
            className="relative z-10 w-64 bg-white dark:bg-gray-950 border-r border-gray-200/60 dark:border-white/10 flex flex-col overflow-y-auto"
            style={{ animation: "slide-in-top 250ms ease-out" }}
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onMobileClose}
              className="absolute right-3 top-3 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-slate-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:hover:bg-slate-800 dark:hover:text-white"
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
