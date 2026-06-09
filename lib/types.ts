export type Severity = "high" | "medium" | "low";

export interface User {
  id: string;
  email: string;
  role: "admin" | "staff" | "counselor";
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

  // ── Classification (new fields) ──
  categories?: string[];
  language?: string | null;
  hard_hits?: string[];
  soft_hits?: string[];
  duration_gate?: string | null;
  required_duration?: number | null;
}

export interface CategoryStats {
  academic_shaming?: number;
  appearance_shaming?: number;
  body_shaming?: number;
  emotional_taunting?: number;
  threat?: number;
  [key: string]: number | undefined;
}

export interface DailySummary {
  total: number;
  high: number;
  medium: number;
  low: number;
  top_category?: string | null;
}

export interface AnalyticsSummary {
  today: DailySummary;
  week?: DailySummary;
}

export interface HeartbeatStatus {
  last_heartbeat: string | null;
  device_status?: "online" | "offline";
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

export interface DictionaryEntry {
  term_id: number;
  slur_text: string;
  language: string;
  severity_weight: number;
  added_at?: string;
}

export interface AuditLog {
  id: number;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface SystemSettings {
  device_status: "online" | "offline";
  last_heartbeat: string | null;
  vosk_version?: string;
  yamnet_version?: string;
  cpu_usage?: number;
  temperature?: number;
  uptime_seconds?: number;
}

export interface Report {
  report_id: string;
  generated_at: string;
  total_incidents: number;
}

export interface PiLog {
  id?: number | string;
  timestamp: string;
  type: string;
  message: string;
}
