"use client";

import DetectionInfo from "@/components/settings/DetectionInfo";
import NotificationsSettings from "@/components/settings/NotificationsSettings";
import { useSettingsMode } from "@/components/settings/shared";

export default function SettingsPage() {
  const mode = useSettingsMode();
  if (mode === "platform") return <DetectionInfo />;
  if (mode === "school") return <NotificationsSettings />;
  return null;
}
