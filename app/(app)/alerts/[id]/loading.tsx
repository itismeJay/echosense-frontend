import { LoadingRows, Page, Skeleton } from "@/components/ui";

export default function AlertLoading() {
  return (
    <Page>
      <Skeleton className="h-9 w-40" />
      <Skeleton className="mt-6 h-11 w-72" />
      <div className="mt-6 rounded-panel border border-line">
        <LoadingRows rows={5} label="Loading alert" />
      </div>
    </Page>
  );
}
