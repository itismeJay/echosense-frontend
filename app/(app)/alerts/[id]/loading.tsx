import AlertListSkeleton from "@/components/AlertListSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
      <div className="mb-6 h-28 animate-pulse rounded-panel bg-surface" />
      <AlertListSkeleton count={1} />
    </div>
  );
}
