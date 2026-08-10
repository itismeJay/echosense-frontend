import ClassroomDetail from "@/components/multi-room/ClassroomDetail";

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClassroomDetail classroomId={id} />;
}
