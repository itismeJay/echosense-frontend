export default function AlertListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2" aria-label="Loading classroom alerts" role="status">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        />
      ))}
      <span className="sr-only">Loading classroom alerts</span>
    </div>
  );
}
