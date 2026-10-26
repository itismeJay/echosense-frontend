import { Suspense } from "react";
import AuditLogDashboard from "@/components/AuditLogDashboard";

export default function AuditPage() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          className="mx-auto max-w-[100rem] p-4 text-sm text-muted md:p-6 lg:p-8"
        >
          Loading audit history…
        </div>
      }
    >
      <AuditLogDashboard />
    </Suspense>
  );
}
