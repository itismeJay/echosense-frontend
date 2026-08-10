import DeviceDetail from "@/components/multi-room/DeviceDetail";

export default async function DeviceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DeviceDetail deviceId={id} />;
}
