import AlertCollection from "@/components/AlertCollection";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function uuidParam(value: string | string[] | undefined) {
  return typeof value === "string" && UUID_PATTERN.test(value) ? value : undefined;
}

export default async function AlertsPage({
  searchParams,
}: PageProps<"/alerts">) {
  const query = await searchParams;
  return (
    <AlertCollection
      mode="alerts"
      initialClassroomId={uuidParam(query.classroom_id)}
      initialDeviceId={uuidParam(query.device_id)}
      initialSchoolId={uuidParam(query.school_id)}
    />
  );
}
