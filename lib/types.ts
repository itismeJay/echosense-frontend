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

  // ── Rich evidence (all optional — backend may omit on older alerts) ──
  transcribed_text?: string;
  detected_words?: string[];
  yamnet_class?: string;
  yamnet_score?: number;
  emotion?: string;
  rms?: number;
  energy_variance?: number;
  zero_crossing_rate?: number;
  peak_to_average?: number;
  waveform_snapshot?: number[];
}

export interface EmotionBreakdown {
  angry: number;
  aggressive: number;
  distressed: number;
  upset: number;
  neutral: number;
  unknown: number;
}

export interface LogsStats {
  total_alerts: number;
  high_severity: number;
  medium_severity: number;
  low_severity: number;

  // ── Evidence aggregates (optional) ──
  emotion_breakdown?: EmotionBreakdown;
  top_detected_words?: string[];
  average_confidence?: number;
}

export interface Settings {
  confidence_threshold: number;
  duration_threshold: number;
  notifications: boolean;
  location: string;
}
