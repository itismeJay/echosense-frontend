export type Severity = "high" | "medium" | "low";

export interface Alert {
  id: number;
  severity: Severity;
  confidence: number;
  duration: number;
  location: string;
  status: "active" | "resolved";
  created_at: string;
}

export interface LogsStats {
  total_alerts: number;
  high_severity: number;
  medium_severity: number;
  low_severity: number;
}

export interface Settings {
  confidence_threshold: number;
  duration_threshold: number;
  notifications: boolean;
  location: string;
}
