"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Radio, Wifi, WifiOff, Menu,
  LayoutDashboard, FileClock, BarChart3, Settings, Users, LogOut,
} from "lucide-react";
import { useAlerts } from "@/lib/AlertsProvider";
import ThemeToggle from "./ThemeToggle";
import { logout, useCurrentUser } from "@/lib/auth";

const BASE_NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/logs",      icon: FileClock,        label: "Logs"      },
  { href: "/analytics", icon: BarChart3,         label: "Analytics" },
];

const ADMIN_NAV_ITEMS = [
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/users",    icon: Users,    label: "Users"    },
];

interface NavbarProps {
  onMenuOpen: () => void;
}

export default function Navbar({ onMenuOpen }: NavbarProps) {
  const { online, loading } = useAlerts();
  const pathname = usePathname();
  const user = useCurrentUser();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navItems = user?.role === "admin"
    ? [...BASE_NAV_ITEMS, ...ADMIN_NAV_ITEMS]
    : BASE_NAV_ITEMS;

  return (
    <>
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
        {navItems.map(({ href, label }) => {
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

      {/* Right: live status + theme toggle + user + hamburger */}
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
              onClick={() => setShowLogoutConfirm(true)}
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
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-gray-200/60 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>
    </header>

      {/* Logout confirmation dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white/90 dark:bg-gray-950/95 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-500/10 shrink-0">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Sign out</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Are you sure you want to sign out?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={logout}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-500/90 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
