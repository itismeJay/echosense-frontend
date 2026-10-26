"use client";

import { useRouter } from "next/navigation";
import { KeyRound, LogOut, Menu as MenuIcon, Moon, Sun, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import Menu from "@/components/ui/Menu";
import { logout, useCurrentUser } from "@/lib/auth";
import { accessRoleOf } from "@/lib/access";
import { clearSchoolScope, useSchoolScope } from "@/lib/school-scope";

const ROLE_LABEL = {
  super_admin: "Platform administrator",
  admin: "School administrator",
  counselor: "Guidance counselor",
  staff: "Teacher",
} as const;

function initials(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : local.slice(0, 2);
  return letters.toUpperCase();
}

export default function TopBar({ onMenuOpen }: { onMenuOpen: () => void }) {
  const user = useCurrentUser();
  const role = accessRoleOf(user);
  const scope = useSchoolScope();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const inSchool = role === "super_admin" && scope !== null;

  // On the green school banner, controls switch to the dark-green ink.
  const control = inSchool
    ? "text-brand-ink hover:bg-brand-ink/10"
    : "text-muted hover:bg-surface hover:text-ink";

  const exitSchool = () => {
    clearSchoolScope();
    router.push("/schools");
  };

  return (
    <header
      className={`sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-2 sm:px-4 ${
        inSchool ? "border-brand bg-brand text-brand-ink" : "border-line bg-bg"
      }`}
    >
      <button
        type="button"
        onClick={onMenuOpen}
        className={`flex min-h-11 min-w-11 items-center justify-center rounded-control md:hidden ${control}`}
        aria-label="Open menu"
      >
        <MenuIcon className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        {inSchool && scope && (
          <p role="status" className="flex min-w-0 items-center gap-x-1.5 text-body">
            <span className="min-w-0 truncate">
              Viewing <strong className="font-semibold">{scope.name}</strong>
            </span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <button
              type="button"
              onClick={exitSchool}
              className="min-h-11 shrink-0 rounded-control px-1 font-semibold underline underline-offset-2 hover:no-underline"
            >
              Exit<span className="hidden sm:inline"> to all schools</span>
            </button>
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className={`flex min-h-11 min-w-11 items-center justify-center rounded-control ${control}`}
        aria-label="Change color theme"
        title="Change color theme"
      >
        <Sun className="hidden h-[18px] w-[18px] dark:block" aria-hidden="true" />
        <Moon className="block h-[18px] w-[18px] dark:hidden" aria-hidden="true" />
      </button>

      {user && (
        <Menu
          label="Account menu"
          triggerClassName={`flex min-h-11 items-center gap-2 rounded-control pl-1 pr-1 sm:pr-2 ${control}`}
          trigger={
            <>
              <span
                aria-hidden="true"
                className={`flex h-8 w-8 items-center justify-center rounded-full text-small font-semibold ${
                  inSchool ? "bg-brand-ink text-brand" : "bg-ink text-bg"
                }`}
              >
                {initials(user.email)}
              </span>
              <span className="hidden max-w-48 truncate text-body sm:block">{user.email}</span>
            </>
          }
          items={[
            {
              kind: "label",
              label: (
                <>
                  <span className="block truncate text-body font-medium text-ink">{user.email}</span>
                  <span className="block text-small text-muted">{role ? ROLE_LABEL[role] : ""}</span>
                </>
              ),
            },
            {
              kind: "link",
              label: "Profile and notifications",
              href: "/profile",
              icon: <UserRound className="h-4 w-4 text-muted" aria-hidden="true" />,
            },
            {
              kind: "link",
              label: "Change password",
              href: "/change-password",
              icon: <KeyRound className="h-4 w-4 text-muted" aria-hidden="true" />,
            },
            {
              kind: "action",
              label: "Sign out",
              onSelect: logout,
              icon: <LogOut className="h-4 w-4" aria-hidden="true" />,
            },
          ]}
        />
      )}
    </header>
  );
}
