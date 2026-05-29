export type Severity = "high" | "medium" | "low";

export interface User {
  id: string;
  email: string;
  role: "admin" | "user";
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

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
