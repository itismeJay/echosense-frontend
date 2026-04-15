import type { Alert, LogsStats } from "./types";

export const MOCK_ALERTS: Alert[] = [
  { id: 30, severity: "high",   confidence: 0.95, duration: 5.2, location: "Grade 6 Classroom", status: "active",   created_at: "2026-04-15T10:42:00Z" },
  { id: 29, severity: "medium", confidence: 0.78, duration: 3.1, location: "Grade 6 Corridor",  status: "resolved", created_at: "2026-04-15T09:15:00Z" },
  { id: 28, severity: "low",    confidence: 0.68, duration: 2.0, location: "Grade 6 Classroom", status: "resolved", created_at: "2026-04-15T08:30:00Z" },
  { id: 27, severity: "high",   confidence: 0.92, duration: 6.4, location: "Grade 6 Classroom", status: "resolved", created_at: "2026-04-14T14:20:00Z" },
  { id: 26, severity: "high",   confidence: 0.89, duration: 4.8, location: "Grade 6 Library",   status: "resolved", created_at: "2026-04-14T11:05:00Z" },
  { id: 25, severity: "medium", confidence: 0.74, duration: 3.5, location: "Grade 6 Classroom", status: "resolved", created_at: "2026-04-14T10:00:00Z" },
  { id: 24, severity: "low",    confidence: 0.65, duration: 1.8, location: "Grade 6 Corridor",  status: "resolved", created_at: "2026-04-14T09:00:00Z" },
  { id: 23, severity: "medium", confidence: 0.81, duration: 2.9, location: "Grade 6 Classroom", status: "resolved", created_at: "2026-04-13T13:45:00Z" },
  { id: 22, severity: "low",    confidence: 0.70, duration: 1.5, location: "Grade 6 Library",   status: "resolved", created_at: "2026-04-13T11:30:00Z" },
  { id: 21, severity: "high",   confidence: 0.97, duration: 7.8, location: "Grade 6 Classroom", status: "resolved", created_at: "2026-04-13T10:15:00Z" },
  { id: 20, severity: "medium", confidence: 0.76, duration: 3.2, location: "Grade 6 Corridor",  status: "resolved", created_at: "2026-04-13T09:30:00Z" },
  { id: 19, severity: "low",    confidence: 0.67, duration: 2.1, location: "Grade 6 Classroom", status: "resolved", created_at: "2026-04-12T15:00:00Z" },
  { id: 18, severity: "medium", confidence: 0.83, duration: 4.0, location: "Grade 6 Library",   status: "resolved", created_at: "2026-04-12T13:20:00Z" },
  { id: 17, severity: "high",   confidence: 0.91, duration: 5.6, location: "Grade 6 Classroom", status: "resolved", created_at: "2026-04-12T11:45:00Z" },
  { id: 16, severity: "medium", confidence: 0.77, duration: 3.7, location: "Grade 6 Corridor",  status: "resolved", created_at: "2026-04-12T10:10:00Z" },
  { id: 15, severity: "high",   confidence: 0.94, duration: 6.1, location: "Grade 6 Classroom", status: "resolved", created_at: "2026-04-11T14:30:00Z" },
  { id: 14, severity: "low",    confidence: 0.71, duration: 1.9, location: "Grade 6 Library",   status: "resolved", created_at: "2026-04-11T12:00:00Z" },
  { id: 13, severity: "medium", confidence: 0.80, duration: 3.4, location: "Grade 6 Classroom", status: "resolved", created_at: "2026-04-11T10:45:00Z" },
  { id: 12, severity: "low",    confidence: 0.66, duration: 1.6, location: "Grade 6 Corridor",  status: "resolved", created_at: "2026-04-11T09:20:00Z" },
  { id: 11, severity: "medium", confidence: 0.79, duration: 2.8, location: "Grade 6 Classroom", status: "resolved", created_at: "2026-04-10T15:15:00Z" },
  { id: 10, severity: "high",   confidence: 0.93, duration: 7.2, location: "Grade 6 Library",   status: "resolved", created_at: "2026-04-10T13:00:00Z" },
  { id: 9,  severity: "medium", confidence: 0.75, duration: 3.0, location: "Grade 6 Corridor",  status: "resolved", created_at: "2026-04-10T11:20:00Z" },
  { id: 8,  severity: "low",    confidence: 0.69, duration: 1.7, location: "Grade 6 Classroom", status: "resolved", created_at: "2026-04-10T09:45:00Z" },
  { id: 7,  severity: "high",   confidence: 0.88, duration: 4.9, location: "Grade 6 Classroom", status: "resolved", created_at: "2026-04-09T14:00:00Z" },
  { id: 6,  severity: "medium", confidence: 0.82, duration: 3.6, location: "Grade 6 Library",   status: "resolved", created_at: "2026-04-09T12:30:00Z" },
  { id: 5,  severity: "low",    confidence: 0.72, duration: 2.2, location: "Grade 6 Corridor",  status: "resolved", created_at: "2026-04-09T10:50:00Z" },
  { id: 4,  severity: "medium", confidence: 0.73, duration: 3.3, location: "Grade 6 Classroom", status: "resolved", created_at: "2026-04-09T09:15:00Z" },
  { id: 3,  severity: "high",   confidence: 0.96, duration: 6.8, location: "Grade 6 Classroom", status: "resolved", created_at: "2026-04-09T08:00:00Z" },
  { id: 2,  severity: "medium", confidence: 0.76, duration: 2.5, location: "Grade 6 Corridor",  status: "resolved", created_at: "2026-04-08T15:30:00Z" },
  { id: 1,  severity: "low",    confidence: 0.67, duration: 1.4, location: "Grade 6 Library",   status: "resolved", created_at: "2026-04-08T10:00:00Z" },
];

export const MOCK_LOGS: Alert[] = MOCK_ALERTS.slice(0, 10);

export const MOCK_STATS: LogsStats = MOCK_ALERTS.reduce(
  (acc, a) => {
    acc.total_alerts++;
    if (a.severity === "high") acc.high_severity++;
    else if (a.severity === "medium") acc.medium_severity++;
    else acc.low_severity++;
    return acc;
  },
  { total_alerts: 0, high_severity: 0, medium_severity: 0, low_severity: 0 }
);
