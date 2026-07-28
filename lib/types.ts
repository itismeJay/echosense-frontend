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
  confidence_threshold_percent: number;
  aggression_duration_threshold: number;
}

export interface SystemSettingsUpdate {
  confidence_threshold: number;
  aggression_duration_threshold: number;
}

export interface DictionaryEntry {
  term_id: number;
  slur_text: string;
  language: string;
  severity_weight: number;
  added_at?: string;
}

export type AuditLogStatus = "SUCCESS" | "FAILURE";

export interface AuditLog {
  id: string;
  occurred_at: string | null;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  target: string | null;
  status: AuditLogStatus | null;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

export interface AuditLogFilters {
  page: number;
  page_size: number;
  search: string;
  actor_email: string;
  actor_role: string;
  action: string;
  resource: string;
  status: AuditLogStatus | "";
  date_from: string;
  date_to: string;
  sort_order: "asc" | "desc";
}

export interface AuditLogListResponse {
  items: AuditLog[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface SystemSettings {
  setting_id: number;
  confidence_threshold: number;
  aggression_duration_threshold: number;
  device_status: "online" | "offline";
  last_heartbeat: string | null;
  vosk_version: string;
  yamnet_version: string;
  last_ota_update?: string | null;
  updated_at?: string | null;
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

export interface SystemLogsResponse {
  lines: PiLog[];
  total: number;
}
