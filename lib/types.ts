export type Severity = "high" | "medium" | "low";
export type AlertSeverity = Severity | "unknown";
export type CanonicalSeverity = "LOW" | "MEDIUM" | "HIGH";
export type AlertStatus = "active" | "resolved" | "unknown";
export type AlertTriggerType = "KEYWORD" | "ACOUSTIC" | "TEST" | "UNKNOWN";
export type DeliveryStatus = "stored" | "unknown";
export type PushStatus =
  | "pending"
  | "accepted"
  | "partial"
  | "rejected"
  | "failed"
  | "skipped"
  | "unknown";
export type AlertLanguage = "fil" | "ceb" | "en" | "mixed" | "unknown";
export type MonitoredTermLanguage = "fil" | "ceb" | "en";

export type EvidenceValue =
  | string
  | number
  | boolean
  | null
  | EvidenceValue[]
  | { [key: string]: EvidenceValue };
export type EvidenceObject = Record<string, EvidenceValue>;

/** Raw network DTO. Every property remains unknown until alert-contract validates it. */
export interface RawAlertDto {
  [key: string]: unknown;
  id?: unknown;
  event_id?: unknown;
  schema_version?: unknown;
  trigger_type?: unknown;
  severity?: unknown;
  severity_level?: unknown;
  created_at?: unknown;
}

export interface SeverityEvidence {
  level: CanonicalSeverity;
  reasons: string[];
  term_categories?: Record<string, string[]>;
  supporting_evidence?: string[];
}

export interface MatchedTerm {
  term_id: number;
  term: string;
  language: MonitoredTermLanguage;
  match_type: string;
}

export interface User {
  id: string;
  email: string;
  role: "admin" | "staff" | "counselor";
  school_id?: string | null;
  is_super_admin?: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

export interface Alert {
  id: number;
  event_id?: string | null;
  schema_version: number | null;
  trigger_type: AlertTriggerType;
  severity: AlertSeverity;
  severity_level: CanonicalSeverity;
  severity_reasons: string[];
  severity_evidence?: SeverityEvidence | null;
  review_message: string;
  review_notice?: string | null;
  confidence?: number | null;
  duration?: number | null;
  location: string;
  classroom_id?: string | null;
  school_id?: string | null;
  classroom_name?: string | null;
  school_name?: string | null;
  device_id?: string | null;
  device_code?: string | null;
  device_display_name?: string | null;
  device_identifier?: string | null;
  device_source?: EvidenceObject | null;
  status: AlertStatus;
  created_at: string;
  event_start_timestamp?: string | null;
  event_end_timestamp?: string | null;
  trigger_timestamp?: string | null;
  test_mode: boolean;
  delivery_status: DeliveryStatus;
  push_status: PushStatus;
  push_attempt_count?: number | null;
  push_submitted_at?: string | null;

  // ── Rich evidence (all optional — backend may omit on older alerts) ──
  transcript?: string | null;
  transcribed_text?: string | null;
  transcription_status?: string | null;
  monitored_terms: EvidenceValue[];
  monitored_word_detected?: boolean | null;
  monitored_word_occurrences: EvidenceObject[];
  acoustic_trigger_evidence?: EvidenceObject | null;
  detailed_acoustic_evidence?: EvidenceObject | null;
  tone_evidence?: EvidenceObject | null;
  repetition_evidence?: EvidenceObject | null;
  direct_address_evidence?: EvidenceObject | null;
  laughter_context?: EvidenceObject | null;
  detected_words?: string[] | null;
  yamnet_class?: string | null;
  yamnet_score?: number | null;
  yamnet_ran?: boolean | null;
  emotion?: string | null;
  rms?: number | null;
  energy_variance?: number | null;
  zero_crossing_rate?: number | null;
  peak_to_average?: number | null;
  waveform_snapshot?: number[] | null;

  // ── Classification (optional for legacy alerts) ──
  categories?: string[] | null;
  language?: AlertLanguage | null;
  language_confidence?: number | null;
  matched_terms?: MatchedTerm[] | null;
  hard_hits?: string[] | null;
  soft_hits?: string[] | null;
  duration_gate?: string | null;
  required_duration?: number | null;
}

export interface SchoolSummary {
  id: string;
  name: string;
}

export interface ClassroomDeviceSummary {
  id: string;
  device_code: string;
  display_name: string;
  is_active: boolean;
}

export interface Classroom {
  id: string;
  school_id: string;
  school_name: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  devices: ClassroomDeviceSummary[];
}

export type DeviceAssignmentState = "assigned" | "unassigned";

export interface EdgeDevice {
  id: string;
  device_code: string;
  display_name: string;
  school_id: string | null;
  school_name: string | null;
  classroom_id: string | null;
  classroom_name: string | null;
  assignment_state: DeviceAssignmentState;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
  assigned_at: string | null;
  key_rotated_at: string | null;
}

export interface ClassroomCreateRequest {
  school_id: string;
  name: string;
}

export interface ClassroomUpdateRequest {
  name?: string;
  is_active?: boolean;
}

export interface DeviceCreateRequest {
  device_code: string;
  display_name: string;
  school_id?: string;
  classroom_id?: string;
}

export interface DeviceUpdateRequest {
  display_name?: string;
}

export interface DeviceAssignmentRequest {
  classroom_id: string;
  expected_current_classroom_id?: string | null;
}

export interface DeviceRegistrationResult {
  device: EdgeDevice;
  device_key: string;
  warning: "Store this key securely. It will not be shown again.";
}

export type DeviceRotationResult = DeviceRegistrationResult;

export interface ClassroomFilters {
  school_id?: string;
  is_active?: boolean;
}

export interface DeviceFilters {
  school_id?: string;
  classroom_id?: string;
  is_active?: boolean;
  unassigned?: boolean;
}

export interface AlertFilters {
  event_id?: string;
  classroom_id?: string;
  school_id?: string;
  device_id?: string;
  category?: string;
  language?: AlertLanguage;
  severity?: string;
  duration_gate?: string;
  skip?: number;
  limit?: number;
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
  language: MonitoredTermLanguage;
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
