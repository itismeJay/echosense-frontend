import AlertsView from "@/components/AlertsView";

function textParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value.slice(0, 200) : undefined;
}

export default async function NeedsReviewPage({ searchParams }: PageProps<"/alerts">) {
  const query = await searchParams;
  return <AlertsView tab="review" initialClassroom={textParam(query.classroom)} />;
}
