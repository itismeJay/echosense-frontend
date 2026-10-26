"use client";

import { usePathname } from "next/navigation";
import { Page, PageHeader, TabLinks } from "@/components/ui";
import { accessRoleOf } from "@/lib/access";
import { useCurrentUser } from "@/lib/auth";
import { useSchoolScope } from "@/lib/school-scope";

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useCurrentUser();
  const scope = useSchoolScope();
  const platform = accessRoleOf(user) === "super_admin" && !scope;

  return (
    <Page>
      <PageHeader
        title={platform ? "Platform activity" : "Activity"}
        description={platform ? "What happened across every school." : "What happened in this school's EchoSense account."}
      />
      <TabLinks
        label="Activity"
        current={pathname === "/activity/system" ? "/activity/system" : "/activity"}
        tabs={[
          { href: "/activity", label: "Account actions" },
          { href: "/activity/system", label: "System logs" },
        ]}
      />
      {children}
    </Page>
  );
}
