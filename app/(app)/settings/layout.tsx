"use client";

import { usePathname } from "next/navigation";
import { Page, PageHeader, TabLinks } from "@/components/ui";
import { useSettingsMode } from "@/components/settings/shared";
import { useSchoolScope } from "@/lib/school-scope";

const SCHOOL_TABS = [
  { href: "/settings", label: "Notifications" },
  { href: "/settings/hours", label: "School hours" },
  { href: "/settings/sensitivity", label: "Sensitivity" },
  { href: "/settings/words", label: "Monitored words" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mode = useSettingsMode();
  const scope = useSchoolScope();

  if (mode === "platform") {
    const words = pathname === "/settings/words";
    return (
      <Page>
        <PageHeader
          title={words ? "Monitored words" : "Detection settings"}
          description={
            words
              ? "The EchoSense word list every school starts from. Schools can turn words off or add their own."
              : "How classroom devices detect possible bullying. Each school sets its own alerts, hours and sensitivity."
          }
        />
        {children}
      </Page>
    );
  }

  const current = SCHOOL_TABS.find((tab) => tab.href !== "/settings" && pathname.startsWith(tab.href))?.href ?? "/settings";
  return (
    <Page>
      <PageHeader
        title="Settings"
        description={
          scope
            ? `Phone alerts, school hours and monitored words for ${scope.name}.`
            : "Phone alerts, school hours and monitored words for your school."
        }
      />
      <TabLinks label="Settings" current={current} tabs={SCHOOL_TABS} />
      {mode === "school" && children}
    </Page>
  );
}
