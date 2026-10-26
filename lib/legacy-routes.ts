// Old URLs from the 16-page layout and where each one lives now. next.config.ts turns
// these into redirects so bookmarks and notification links never 404.
export const LEGACY_REDIRECTS: ReadonlyArray<{ source: string; destination: string }> = [
  { source: "/dashboard", destination: "/overview" },
  { source: "/logs", destination: "/alerts/all" },
  { source: "/counselor", destination: "/reports" },
  { source: "/analytics", destination: "/reports" },
  { source: "/devices", destination: "/classrooms" },
  { source: "/devices/:id", destination: "/classrooms" },
  { source: "/users", destination: "/people" },
  { source: "/admin", destination: "/overview" },
  { source: "/admin/heartbeat", destination: "/classrooms" },
  { source: "/admin/heatmap", destination: "/classrooms" },
  { source: "/admin/dictionary", destination: "/settings/words" },
  { source: "/admin/audit", destination: "/activity" },
  { source: "/admin/logs", destination: "/activity/system" },
  { source: "/admin/schools", destination: "/schools" },
];
