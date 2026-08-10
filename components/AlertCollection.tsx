"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Download, RefreshCw, Search } from "lucide-react";
import { useAlerts } from "@/lib/AlertsProvider";
import { useCurrentUser } from "@/lib/auth";
import {
  ApiError,
  getAlertsWithMetadata,
  getClassrooms,
  getDevices,
} from "@/lib/api";
import type {
  Alert,
  AlertLanguage,
  Classroom,
  EdgeDevice,
  Severity,
} from "@/lib/types";
import {
  classroomLabel,
  deliveryStatusLabel,
  eventTime,
  isTestAlert,
  monitoredTermCount,
  pushStatusLabel,
  reviewStatusLabel,
  schoolLabel,
  triggerTypeLabel,
} from "@/lib/alert-presentation";
import { csvEscape } from "@/lib/format";
import AlertCard from "./AlertCard";
import AlertListSkeleton from "./AlertListSkeleton";

type PriorityFilter = "all" | Severity;
type EmotionFilter = "all" | "angry" | "aggressive" | "distressed" | "upset" | "neutral";
type CategoryFilter = "all" | "academic_shaming" | "appearance_shaming" | "body_shaming" | "emotional_taunting" | "threat";
type LanguageFilter = "all" | AlertLanguage;
type TriggerFilter = "all" | "threat" | "hard" | "repeated" | "medium" | "soft";

const PRIORITIES: { label: string; value: PriorityFilter }[] = [
  { label: "All priorities", value: "all" },
  { label: "HIGH", value: "high" },
  { label: "MEDIUM", value: "medium" },
  { label: "LOW", value: "low" },
];

const CATEGORY_OPTIONS: { label: string; value: CategoryFilter }[] = [
  { label: "All concern categories", value: "all" },
  { label: "Academic", value: "academic_shaming" },
  { label: "Appearance", value: "appearance_shaming" },
  { label: "Body", value: "body_shaming" },
  { label: "Emotional", value: "emotional_taunting" },
  { label: "Threat", value: "threat" },
];

const LANGUAGE_OPTIONS: { label: string; value: LanguageFilter }[] = [
  { label: "All languages", value: "all" },
  { label: "Filipino", value: "fil" },
  { label: "Bisaya/Cebuano", value: "ceb" },
  { label: "English", value: "en" },
  { label: "Mixed language", value: "mixed" },
  { label: "Language unavailable", value: "unknown" },
];

const TRIGGER_OPTIONS: { label: string; value: TriggerFilter }[] = [
  { label: "All detection reasons", value: "all" },
  { label: "Immediate concern", value: "threat" },
  { label: "High-priority term", value: "hard" },
  { label: "Repeated phrase", value: "repeated" },
  { label: "Multiple terms", value: "medium" },
  { label: "Possible pattern", value: "soft" },
];

const EMOTION_OPTIONS: { label: string; value: EmotionFilter }[] = [
  { label: "All possible vocal tones", value: "all" },
  { label: "Angry", value: "angry" },
  { label: "Aggressive", value: "aggressive" },
  { label: "Distressed", value: "distressed" },
  { label: "Upset", value: "upset" },
  { label: "Neutral", value: "neutral" },
];

const SELECT =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

interface AlertCollectionProps {
  mode: "alerts" | "history";
  initialClassroomId?: string;
  initialDeviceId?: string;
  initialSchoolId?: string;
}

export default function AlertCollection({
  mode,
  initialClassroomId = "",
  initialDeviceId = "",
  initialSchoolId = "",
}: AlertCollectionProps) {
  const {
    alerts,
    loading,
    error,
    errorStatus,
    warning,
    isStale,
    lastUpdated,
    refresh,
  } = useAlerts();
  const user = useCurrentUser();
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [language, setLanguage] = useState<LanguageFilter>("all");
  const [trigger, setTrigger] = useState<TriggerFilter>("all");
  const [emotion, setEmotion] = useState<EmotionFilter>("all");
  const [page, setPage] = useState(0);
  const [classroomId, setClassroomId] = useState(initialClassroomId);
  const [deviceId, setDeviceId] = useState(initialDeviceId);
  const [schoolId, setSchoolId] = useState(initialSchoolId);
  const [serverAlerts, setServerAlerts] = useState<Alert[] | null>(null);
  const [serverLoading, setServerLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverErrorStatus, setServerErrorStatus] = useState<number | null>(null);
  const [serverWarning, setServerWarning] = useState<string | null>(null);
  const [serverRefreshKey, setServerRefreshKey] = useState(0);
  const [managementClassrooms, setManagementClassrooms] = useState<Classroom[]>([]);
  const [managementDevices, setManagementDevices] = useState<EdgeDevice[]>([]);

  const isHistory = mode === "history";
  const pageSize = isHistory ? 10 : 6;
  const isSuperAdmin = user?.is_super_admin === true;
  const activeSchoolId = isSuperAdmin ? schoolId : "";
  const hasServerFilters = Boolean(classroomId || deviceId || activeSchoolId);

  useEffect(() => {
    if (user?.role !== "admin") return;
    let active = true;
    const timer = setTimeout(() => {
      void Promise.all([getClassrooms(), getDevices()])
        .then(([classrooms, devices]) => {
          if (!active) return;
          setManagementClassrooms(classrooms);
          setManagementDevices(devices);
        })
        .catch(() => {
          // Alert-derived options remain available if management data is unavailable.
        });
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [user?.role]);

  const classroomOptions = useMemo(() => {
    const options = new Map<string, { id: string; name: string; schoolId: string | null; schoolName: string }>();
    alerts.forEach((alert) => {
      if (alert.classroom_id && alert.classroom_name) {
        options.set(alert.classroom_id, {
          id: alert.classroom_id,
          name: alert.classroom_name,
          schoolId: alert.school_id ?? null,
          schoolName: alert.school_name ?? "School unavailable",
        });
      }
    });
    managementClassrooms.forEach((classroom) => {
      options.set(classroom.id, {
        id: classroom.id,
        name: classroom.name,
        schoolId: classroom.school_id,
        schoolName: classroom.school_name,
      });
    });
    return [...options.values()].sort((left, right) => left.name.localeCompare(right.name));
  }, [alerts, managementClassrooms]);

  const schoolOptions = useMemo(() => {
    const options = new Map<string, string>();
    alerts.forEach((alert) => {
      if (alert.school_id && alert.school_name) options.set(alert.school_id, alert.school_name);
    });
    managementClassrooms.forEach((classroom) => {
      options.set(classroom.school_id, classroom.school_name);
    });
    managementDevices.forEach((device) => {
      if (device.school_id && device.school_name) {
        options.set(device.school_id, device.school_name);
      }
    });
    return [...options].map(([id, name]) => ({ id, name })).sort((left, right) => left.name.localeCompare(right.name));
  }, [alerts, managementClassrooms, managementDevices]);

  const deviceOptions = useMemo(() => {
    const options = new Map<string, { id: string; label: string; schoolId: string | null; classroomId: string | null }>();
    alerts.forEach((alert) => {
      if (alert.device_id) {
        options.set(alert.device_id, {
          id: alert.device_id,
          label: alert.device_display_name?.trim() || alert.device_code?.trim() || "Unnamed Edge device",
          schoolId: alert.school_id ?? null,
          classroomId: alert.classroom_id ?? null,
        });
      }
    });
    managementDevices.forEach((device) => {
      options.set(device.id, {
        id: device.id,
        label: device.display_name.trim() || device.device_code,
        schoolId: device.school_id,
        classroomId: device.classroom_id,
      });
    });
    return [...options.values()].sort((left, right) => left.label.localeCompare(right.label));
  }, [alerts, managementDevices]);

  const availableClassrooms = classroomOptions.filter(
    (classroom) => !activeSchoolId || classroom.schoolId === activeSchoolId
  );
  const availableDevices = deviceOptions.filter(
    (device) =>
      (!activeSchoolId || device.schoolId === activeSchoolId) &&
      (!classroomId || device.classroomId === classroomId)
  );
  const currentSchoolName =
    schoolOptions.find((school) => school.id === user?.school_id)?.name ??
    (schoolOptions.length === 1 ? schoolOptions[0].name : null);

  useEffect(() => {
    if (!hasServerFilters) return;
    let active = true;
    const timer = setTimeout(() => {
      setServerLoading(true);
      void getAlertsWithMetadata({
        ...(classroomId ? { classroom_id: classroomId } : {}),
        ...(deviceId ? { device_id: deviceId } : {}),
        ...(activeSchoolId ? { school_id: activeSchoolId } : {}),
      })
        .then((result) => {
          if (!active) return;
          setServerAlerts(result.alerts);
          setServerWarning(result.warning);
          setServerError(null);
          setServerErrorStatus(null);
        })
        .catch((caught) => {
          if (!active) return;
          setServerError(caught instanceof Error ? caught.message : "Filtered alerts are unavailable.");
          setServerErrorStatus(caught instanceof ApiError ? caught.status : null);
        })
        .finally(() => {
          if (active) setServerLoading(false);
        });
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [activeSchoolId, classroomId, deviceId, hasServerFilters, lastUpdated, serverRefreshKey]);

  const displayedAlerts = useMemo(
    () => (hasServerFilters ? serverAlerts ?? [] : alerts),
    [alerts, hasServerFilters, serverAlerts]
  );
  const displayedLoading = hasServerFilters
    ? serverLoading || serverAlerts === null
    : loading;
  const displayedError = hasServerFilters ? serverError : error;
  const displayedErrorStatus = hasServerFilters ? serverErrorStatus : errorStatus;
  const displayedWarning = hasServerFilters ? serverWarning : warning;

  const filtered = useMemo(
    () =>
      [...displayedAlerts]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .filter((alert) => {
          if (priority !== "all" && alert.severity !== priority) return false;
          if (search && !alert.location.toLowerCase().includes(search.toLowerCase())) return false;
          if (category !== "all" && !(alert.categories ?? []).includes(category)) return false;
          if (
            language === "unknown" &&
            alert.language != null &&
            alert.language !== "unknown"
          ) {
            return false;
          }
          if (
            language !== "all" &&
            language !== "unknown" &&
            alert.language !== language
          ) {
            return false;
          }
          if (trigger !== "all" && alert.duration_gate !== trigger) return false;
          if (emotion !== "all" && (alert.emotion ?? "").toLowerCase() !== emotion) return false;
          return true;
        }),
    [category, displayedAlerts, emotion, language, priority, search, trigger]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const updateFilter = (callback: () => void) => {
    callback();
    setPage(0);
  };

  const syncUrl = (nextClassroomId: string, nextDeviceId: string, nextSchoolId: string) => {
    if (mode !== "alerts") return;
    const url = new URL(window.location.href);
    const values = {
      classroom_id: nextClassroomId,
      device_id: nextDeviceId,
      school_id: nextSchoolId,
    };
    Object.entries(values).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  };

  const changeSchool = (nextSchoolId: string) => {
    setSchoolId(nextSchoolId);
    setClassroomId("");
    setDeviceId("");
    setServerAlerts(null);
    setPage(0);
    syncUrl("", "", nextSchoolId);
  };

  const changeClassroom = (nextClassroomId: string) => {
    const selectedDevice = deviceOptions.find((device) => device.id === deviceId);
    const nextDeviceId =
      nextClassroomId && selectedDevice?.classroomId !== nextClassroomId ? "" : deviceId;
    setClassroomId(nextClassroomId);
    setDeviceId(nextDeviceId);
    setServerAlerts(null);
    setPage(0);
    syncUrl(nextClassroomId, nextDeviceId, schoolId);
  };

  const changeDevice = (nextDeviceId: string) => {
    setDeviceId(nextDeviceId);
    setServerAlerts(null);
    setPage(0);
    syncUrl(classroomId, nextDeviceId, schoolId);
  };

  const refreshDisplayedAlerts = () => {
    if (hasServerFilters) setServerRefreshKey((value) => value + 1);
    else void refresh();
  };

  const handleExport = () => {
    const headers = [
      "ID",
      "Priority",
      "Trigger Type",
      "Test Alert",
      "Classroom",
      "School",
      "Review Status",
      "Monitored-term Occurrences",
      "Delivery Status",
      "Push Status",
      "Event Time",
    ];
    const rows = filtered.map((alert) => [
      alert.id,
      alert.severity,
      csvEscape(triggerTypeLabel(alert)),
      isTestAlert(alert) ? "YES — TEST DATA" : "No",
      csvEscape(classroomLabel(alert)),
      csvEscape(schoolLabel(alert)),
      csvEscape(reviewStatusLabel(alert)),
      monitoredTermCount(alert),
      csvEscape(deliveryStatusLabel(alert)),
      csvEscape(pushStatusLabel(alert)),
      eventTime(alert),
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `echosense-alert-history-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
          Classroom Monitoring System
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
          {isHistory ? "Alert History" : "Classroom Alerts"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {isHistory
            ? "Search and view previously recorded classroom alerts."
            : "View recent possible classroom concerns. These automated alerts are unverified."}
        </p>
      </header>

      {displayedError && (
        <div
          role="alert"
          className="mb-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/60 dark:bg-red-950/30"
        >
          <div>
            <p className="font-semibold text-red-900 dark:text-red-100">
              {displayedErrorStatus === 403
                ? "You do not have permission to view classroom alerts."
                : "We couldn’t load classroom alerts."}
            </p>
            <p className="mt-1 text-sm text-red-800 dark:text-red-200">
              {displayedErrorStatus === 403
                ? "Contact an administrator if you believe you should have access."
                : "The service may be temporarily unavailable. Please try again."}
            </p>
          </div>
          {displayedErrorStatus !== 403 && (
            hasServerFilters ? (
              <button
                type="button"
                onClick={refreshDisplayedAlerts}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </button>
            )
          )}
        </div>
      )}

      {(displayedWarning || (!hasServerFilters && isStale)) && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100"
        >
          {!hasServerFilters && isStale
            ? `Showing retained alert data because the latest poll failed${lastUpdated ? ` (last updated ${lastUpdated.toLocaleTimeString()})` : ""}.`
            : displayedWarning}
        </div>
      )}

      <section aria-label="Alert filters" className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <fieldset className="flex-1">
            <legend className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              Priority
            </legend>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={priority === option.value}
                  onClick={() => updateFilter(() => setPriority(option.value))}
                  className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                    priority === option.value
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="w-full lg:max-w-sm">
            <label htmlFor={`${mode}-location-search`} className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">
              Search by classroom
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                id={`${mode}-location-search`}
                type="search"
                value={search}
                onChange={(event) => updateFilter(() => setSearch(event.target.value))}
                placeholder="e.g. Grade 6"
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-slate-800">
          {isSuperAdmin ? (
            <div>
              <label htmlFor={`${mode}-school-filter`} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                School
              </label>
              <select id={`${mode}-school-filter`} value={schoolId} onChange={(event) => changeSchool(event.target.value)} className={SELECT}>
                <option value="">All authorized schools</option>
                {schoolOptions.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
              </select>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">School context</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{currentSchoolName ?? "Your assigned school"}</p>
            </div>
          )}
          <div>
            <label htmlFor={`${mode}-classroom-filter`} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Classroom
            </label>
            <select id={`${mode}-classroom-filter`} value={classroomId} onChange={(event) => changeClassroom(event.target.value)} className={SELECT}>
              <option value="">All classrooms</option>
              {availableClassrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{isSuperAdmin && !activeSchoolId ? `${classroom.schoolName} · ` : ""}{classroom.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${mode}-device-filter`} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Edge device
            </label>
            <select id={`${mode}-device-filter`} value={deviceId} onChange={(event) => changeDevice(event.target.value)} className={SELECT}>
              <option value="">All devices</option>
              {availableDevices.map((device) => <option key={device.id} value={device.id}>{device.label}</option>)}
            </select>
          </div>
        </div>

        {isHistory && (
          <details className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-slate-200 dark:hover:text-white">
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
              More filters and export
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="history-category" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Concern category
                </label>
                <select id="history-category" value={category} onChange={(event) => updateFilter(() => setCategory(event.target.value as CategoryFilter))} className={SELECT}>
                  {CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="history-language" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Language
                </label>
                <select id="history-language" value={language} onChange={(event) => updateFilter(() => setLanguage(event.target.value as LanguageFilter))} className={SELECT}>
                  {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="history-trigger" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Detection reason
                </label>
                <select id="history-trigger" value={trigger} onChange={(event) => updateFilter(() => setTrigger(event.target.value as TriggerFilter))} className={SELECT}>
                  {TRIGGER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="history-emotion" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Possible vocal tone
                </label>
                <select id="history-emotion" value={emotion} onChange={(event) => updateFilter(() => setEmotion(event.target.value as EmotionFilter))} className={SELECT}>
                  {EMOTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Export filtered history
              </button>
            </div>
          </details>
        )}
      </section>

      {displayedLoading && displayedAlerts.length === 0 ? (
        <AlertListSkeleton count={isHistory ? 6 : 4} />
      ) : displayedError && displayedAlerts.length === 0 ? null : error && alerts.length === 0 ? null : visible.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {filtered.length === 0 && displayedAlerts.length > 0
              ? "No alerts match these filters."
              : "No alerts need attention today."}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            New classroom alerts will appear here automatically.
          </p>
        </section>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-300" aria-live="polite">
              {filtered.length} alert{filtered.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-between gap-4" aria-label="Alert pages">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Page {safePage + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage(Math.max(0, safePage - 1))}
              className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
              className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
