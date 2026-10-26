"use client";

import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { Note, Page, PageHeader, TabLinks } from "@/components/ui";
import { canEditGlobalConfig } from "@/lib/access";
import { useCurrentUser } from "@/lib/auth";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useCurrentUser();
  const canEdit = canEditGlobalConfig(user);

  return (
    <Page>
      <PageHeader
        title="Settings"
        description="How sensitive classroom devices are, and which words they listen for. These apply to every school."
      />
      {user && !canEdit && (
        <div className="mb-5 max-w-2xl">
          <Note icon={Lock}>You can view these settings. Only the platform administrator can change them.</Note>
        </div>
      )}
      <TabLinks
        label="Settings"
        current={pathname === "/settings/words" ? "/settings/words" : "/settings"}
        tabs={[
          { href: "/settings", label: "Detection" },
          { href: "/settings/words", label: "Monitored words" },
        ]}
      />
      {children}
    </Page>
  );
}
