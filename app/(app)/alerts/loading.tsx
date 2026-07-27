import AlertListSkeleton from "@/components/AlertListSkeleton";

export default function AlertsLoading() {
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
      <div className="mb-6 h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <AlertListSkeleton />
    </div>
  );
}
