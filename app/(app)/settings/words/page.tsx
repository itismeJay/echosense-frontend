"use client";

import GlobalWords from "@/components/settings/GlobalWords";
import SchoolWords from "@/components/settings/SchoolWords";
import { useSettingsMode } from "@/components/settings/shared";

export default function MonitoredWordsPage() {
  const mode = useSettingsMode();
  if (mode === "platform") return <GlobalWords />;
  if (mode === "school") return <SchoolWords />;
  return null;
}
