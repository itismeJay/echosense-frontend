import AlertsView from "@/components/AlertsView";

function textParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value.slice(0, 200) : undefined;
}

export default async function AllAlertsPage({ searchParams }: PageProps<"/alerts/all">) {
  const query = await searchParams;
  return <AlertsView tab="all" initialClassroom={textParam(query.classroom)} />;
}
