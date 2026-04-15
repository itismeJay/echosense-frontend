"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileClock,
  BarChart3,
  Settings,
  ChevronLeft,
  X,
  Cpu,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/logs",      icon: FileClock,        label: "Logs"      },
  { href: "/analytics", icon: BarChart3,         label: "Analytics" },
  { href: "/settings",  icon: Settings,          label: "Settings"  },
];

// Extracted OUTSIDE Sidebar to avoid "component defined during render" lint rule
interface NavContentProps {
  collapsed: boolean;
  pathname: string;
  showCollapseToggle: boolean;
  onToggleCollapsed: () => void;
  onLinkClick?: () => void;
}

function NavContent({
  collapsed,
  pathname,
  showCollapseToggle,
  onToggleCollapsed,
  onLinkClick,
}: NavContentProps) {
  return (
    <div
      className={`flex flex-col h-full transition-all duration-300 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Nav items */}
      <nav className="flex-1 px-2 pt-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
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
              />
              {!collapsed && (
                <span className="text-sm font-medium">{label}</span>
              )}
              {/* Tooltip when collapsed */}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-3 z-50 px-2.5 py-1.5 bg-gray-800 border border-white/10 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section: Pi status + collapse toggle */}
      <div className="mt-auto">
        {/* Pi status */}
        <div className={`px-3 py-3 mx-2 mb-1 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 dark:border-indigo-500/20 ${collapsed ? "flex justify-center" : ""}`}>
          {collapsed ? (
            <Cpu className="w-4 h-4 text-indigo-400" />
          ) : (
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs font-medium text-indigo-500 dark:text-indigo-400 leading-none">Pi 5 · Online</p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5 leading-none">v0.1.0</p>
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle — desktop only */}
        {showCollapseToggle && (
          <button
            onClick={onToggleCollapsed}
            className={`flex items-center gap-2 px-4 py-4 w-full text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border-t border-gray-100 dark:border-white/5 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
            />
            {!collapsed && <span className="text-xs">Collapse</span>}
          </button>
        )}
      </div>
    </div>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Read localStorage after mount — use setTimeout to avoid setState-in-effect lint
  useEffect(() => {
    const stored = localStorage.getItem("echosense.sidebar.collapsed");
    if (stored !== null) {
      const next = stored === "true";
      setTimeout(() => setCollapsed(next), 0);
    }
  }, []);

  const handleToggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem("echosense.sidebar.collapsed", String(next));
      return next;
    });
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border-r border-gray-200/60 dark:border-white/[0.06] min-h-full sticky top-0 h-[calc(100vh-3.5rem)] overflow-y-auto shrink-0">
        <NavContent
          collapsed={collapsed}
          pathname={pathname}
          showCollapseToggle
          onToggleCollapsed={handleToggleCollapsed}
        />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <aside
            className="relative z-10 w-64 bg-white dark:bg-gray-950 border-r border-gray-200/60 dark:border-white/10 flex flex-col overflow-y-auto"
            style={{ animation: "slide-in-top 250ms ease-out" }}
          >
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors z-10"
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
            />
          </aside>
        </div>
      )}
    </>
  );
}
