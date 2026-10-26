"use client";

import { KeyRound } from "lucide-react";
import NotificationSettings from "@/components/NotificationSettings";
import { ButtonLink, Detail, Page, PageHeader, Panel, Skeleton } from "@/components/ui";
import { isSuperAdmin } from "@/lib/access";
import { useCurrentUser } from "@/lib/auth";

const ROLE_LABELS = {
  admin: "School administrator",
  staff: "Teacher",
  counselor: "Guidance counselor",
} as const;

export default function ProfilePage() {
  const user = useCurrentUser();

  return (
    <Page className="max-w-[760px]">
      <PageHeader title="Profile" description="Your account and how EchoSense lets you know about new alerts." />

      <div className="space-y-4">
        <Panel title="Your account" description="Your school administrator manages your email and role.">
          {!user ? (
            <div role="status">
              <span className="sr-only">Loading your account</span>
              <Skeleton className="h-12" />
            </div>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Email">{user.email}</Detail>
              <Detail label="Role">{isSuperAdmin(user) ? "Platform administrator" : ROLE_LABELS[user.role]}</Detail>
            </dl>
          )}
        </Panel>

        <NotificationSettings />

        <Panel title="Password">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-body text-muted">Change the password you use to sign in.</p>
            <ButtonLink href="/change-password" icon={KeyRound}>
              Change password
            </ButtonLink>
          </div>
        </Panel>
      </div>
    </Page>
  );
}
