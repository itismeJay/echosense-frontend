"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radio, Wifi, WifiOff, Menu, LayoutDashboard, FileClock, BarChart3, Settings, LogOut } from "lucide-react";
import { useAlerts } from "@/lib/AlertsProvider";
import ThemeToggle from "./ThemeToggle";
import { logout, useCurrentUser } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/logs",      icon: FileClock,        label: "Logs"      },
  { href: "/analytics", icon: BarChart3,         label: "Analytics" },
  { href: "/settings",  icon: Settings,          label: "Settings"  },
];

interface NavbarProps {
  onMenuOpen: () => void;
}

export default function Navbar({ onMenuOpen }: NavbarProps) {
  const { online, loading } = useAlerts();
  const pathname = usePathname();
  const user = useCurrentUser();

  return (
    <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 md:px-6 bg-white/70 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/[0.06] shrink-0">
      {/* Left: wordmark */}
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-xl bg-indigo-500/10 shrink-0">
          <Radio className="w-4 h-4 text-indigo-400" />
        </div>
        <span className="font-black text-sm bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
          EchoSense
        </span>
      </div>

      {/* Center: nav links (desktop only) */}
      <nav className="hidden md:flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative px-4 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 ${
                active
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/5"
              }`}
            >
              {label}
              {active && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right: live status + theme toggle + hamburger */}
      <div className="flex items-center gap-2">
        {/* Live status pill */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
            loading
              ? "bg-gray-500/10 border-gray-500/20 text-gray-500 dark:text-gray-400"
              : online
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
          }`}
        >
          {loading ? (
            <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : online ? (
            <Wifi className="w-3 h-3 animate-pulse" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          {loading ? "Connecting..." : online ? "Live" : "Offline"}
        </div>

        <ThemeToggle />

        {/* User email + logout */}
        {user && (
          <>
            <span className="hidden sm:block text-xs text-gray-400 dark:text-gray-500 font-mono truncate max-w-[140px]">
              {user.email}
            </span>
            <button
              onClick={logout}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-gray-200/60 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Mobile hamburger */}
        <button
          onClick={onMenuOpen}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 dark:border-white/10 border-gray-200/60 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
