import { notFound, redirect } from "next/navigation";

export default async function AlertDeepLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    notFound();
  }
  redirect(`/alerts/${id}`);
}
