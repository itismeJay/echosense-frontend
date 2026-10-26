import { Suspense } from "react";
import AuditLogDashboard from "@/components/AuditLogDashboard";
import { LoadingRows } from "@/components/ui";

export default function AccountActionsPage() {
  return (
    <Suspense fallback={<LoadingRows rows={4} label="Loading account actions" />}>
      <AuditLogDashboard />
    </Suspense>
  );
}
