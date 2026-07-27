"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  School,
  Wifi,
  WifiOff,
  Menu,
  LayoutDashboard,
  BellRing,
  FileClock,
  LogOut,
} from "lucide-react";
import { useAlerts } from "@/lib/AlertsProvider";
import ThemeToggle from "./ThemeToggle";
import { logout, useCurrentUser } from "@/lib/auth";

const BASE_NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/alerts", icon: BellRing, label: "Alerts" },
  { href: "/logs", icon: FileClock, label: "History" },
];

interface NavbarProps {
  onMenuOpen: () => void;
  mobileMenuOpen: boolean;
}

export default function Navbar({ onMenuOpen, mobileMenuOpen }: NavbarProps) {
  const { online, loading } = useAlerts();
  const pathname = usePathname();
  const user = useCurrentUser();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const signOutButtonRef = useRef<HTMLButtonElement>(null);
  const logoutButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasMenuOpenRef = useRef(false);

  useEffect(() => {
    if (wasMenuOpenRef.current && !mobileMenuOpen) {
      menuButtonRef.current?.focus();
    }
    wasMenuOpenRef.current = mobileMenuOpen;
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!showLogoutConfirm) return;
    const logoutTrigger = logoutButtonRef.current;
    cancelButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowLogoutConfirm(false);
        return;
      }
      if (event.key !== "Tab") return;
      if (event.shiftKey && document.activeElement === cancelButtonRef.current) {
        event.preventDefault();
        signOutButtonRef.current?.focus();
      } else if (!event.shiftKey && document.activeElement === signOutButtonRef.current) {
        event.preventDefault();
        cancelButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      logoutTrigger?.focus();
    };
  }, [showLogoutConfirm]);

  return (
    <>
    <header className="sticky top-0 z-40 flex min-h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 dark:border-slate-800 dark:bg-slate-950/95 md:px-6">
      {/* Left: wordmark */}
      <div className="flex items-center gap-2.5">
        <div className="shrink-0 rounded-xl bg-indigo-100 p-2 dark:bg-indigo-950/60">
          <School className="h-5 w-5 text-indigo-700 dark:text-indigo-300" aria-hidden="true" />
        </div>
        <span className="text-sm font-bold tracking-tight text-slate-950 dark:text-white">
          EchoSense
        </span>
      </div>

      {/* Center: nav links (desktop only) */}
      <nav aria-label="Main shortcuts" className="hidden items-center gap-1 md:flex">
        {BASE_NAV_ITEMS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-11 items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
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

      {/* Right: update status + theme toggle + user + hamburger */}
      <div className="flex items-center gap-2">
        {/* Backend update status pill */}
        <div
          role="status"
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
            loading
              ? "bg-gray-500/10 border-gray-500/20 text-gray-500 dark:text-gray-400"
              : online
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
          }`}
        >
          {loading ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
          ) : online ? (
            <Wifi className="h-3 w-3" aria-hidden="true" />
          ) : (
            <WifiOff className="h-3 w-3" aria-hidden="true" />
          )}
          {loading ? "Checking updates" : online ? "Updates connected" : "Updates unavailable"}
        </div>

        <ThemeToggle />

        {/* User email + logout */}
        {user && (
          <>
            <span className="hidden max-w-[140px] truncate text-xs text-slate-500 dark:text-slate-400 sm:block">
              {user.email}
            </span>
            <button
              ref={logoutButtonRef}
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-red-950/30 dark:hover:text-red-300"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Mobile hamburger */}
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onMenuOpen}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white md:hidden"
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
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-description"
            className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-500/10 shrink-0">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 id="logout-dialog-title" className="text-base font-semibold text-gray-900 dark:text-white">Sign out</h2>
                <p id="logout-dialog-description" className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Are you sure you want to sign out?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="min-h-11 flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                ref={signOutButtonRef}
                type="button"
                onClick={logout}
                className="min-h-11 flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
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
