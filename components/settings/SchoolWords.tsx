"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff, Plus, Search, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/multi-room/ConfirmDialog";
import { Button, EmptyState, Field, FormError, Panel, inputClass, selectClass } from "@/components/ui";
import { addSchoolTerm, deleteSchoolTerm, getSchoolTerms, setGlobalTermForSchool } from "@/lib/api";
import { languageLabel } from "@/lib/format";
import { buildSchoolTermPayload, type SchoolTerm, type SchoolTerms } from "@/lib/school-settings";
import type { MonitoredTermLanguage } from "@/lib/types";
import { SettingsLoadError, SettingsLoading, errorText } from "./shared";

const LANGUAGE_OPTIONS: { value: MonitoredTermLanguage; label: string }[] = [
  { value: "fil", label: "Filipino" },
  { value: "ceb", label: "Bisaya/Cebuano" },
  { value: "en", label: "English" },
];

const WEIGHT_OPTIONS = [
  { value: 0.8, label: "Serious" },
  { value: 0.5, label: "Moderate" },
  { value: 0.3, label: "Mild" },
];

function AddWordForm({ onAdded }: { onAdded: (term: SchoolTerm) => void }) {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<MonitoredTermLanguage>("fil");
  const [weight, setWeight] = useState(0.5);
  const [problem, setProblem] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const built = buildSchoolTermPayload({ text, language, severity_weight: weight });
    if ("error" in built) {
      setProblem(built.error);
      return;
    }
    setProblem("");
    setSaving(true);
    try {
      const term = await addSchoolTerm(built.payload);
      onAdded(term);
      setText("");
      toast.success(`Your school now listens for “${term.text}”`);
    } catch (caught) {
      setProblem(errorText(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel
      title="Add a word for our school"
      description="Local slang or names used to bully students here. Only this school's devices listen for it."
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="grid gap-4 md:grid-cols-[2fr_1fr_1.5fr_auto] md:items-end">
        <Field id="school-word" label="Word or phrase">
          <input
            id="school-word"
            type="text"
            autoComplete="off"
            maxLength={100}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field id="school-word-language" label="Language">
          <select
            id="school-word-language"
            value={language}
            onChange={(event) => setLanguage(event.target.value as MonitoredTermLanguage)}
            className={selectClass}
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="school-word-weight" label="How serious" hint="Serious: insults or threats. Mild: worth a look.">
          <select
            id="school-word-weight"
            value={weight}
            onChange={(event) => setWeight(Number(event.target.value))}
            aria-describedby="school-word-weight-hint"
            className={selectClass}
          >
            {WEIGHT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Button type="submit" variant="primary" icon={Plus} pending={saving}>
          Add word
        </Button>
      </form>
      {problem && (
        <div className="mt-3">
          <FormError>{problem}</FormError>
        </div>
      )}
    </Panel>
  );
}

export default function SchoolWords() {
  const [terms, setTerms] = useState<SchoolTerms | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState("");
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [removeTarget, setRemoveTarget] = useState<SchoolTerm | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      setTerms(await getSchoolTerms());
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const visibleGlobal = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return (terms?.global_terms ?? []).filter((term) => !needle || term.text.toLowerCase().includes(needle));
  }, [filter, terms]);

  if (loadError) return <SettingsLoadError onRetry={() => void load()} />;
  if (!terms) return <SettingsLoading label="Loading monitored words" />;

  const offCount = terms.global_terms.filter((term) => !term.enabled_for_school).length;

  const toggleGlobal = async (termId: number, enabled: boolean) => {
    setPendingId(termId);
    try {
      const updated = await setGlobalTermForSchool(termId, enabled);
      setTerms((current) =>
        current && {
          ...current,
          global_terms: current.global_terms.map((term) => (term.term_id === termId ? updated : term)),
        }
      );
      toast.success(enabled ? `“${updated.text}” is on again for your school` : `“${updated.text}” is off for your school`);
    } catch (caught) {
      toast.error(errorText(caught));
    } finally {
      setPendingId(null);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await deleteSchoolTerm(removeTarget.id);
      setTerms((current) =>
        current && { ...current, school_terms: current.school_terms.filter((term) => term.id !== removeTarget.id) }
      );
      toast.success(`Your school no longer listens for “${removeTarget.text}”`);
      setRemoveTarget(null);
    } catch (caught) {
      toast.error(errorText(caught));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="max-w-[960px] space-y-4">
      <p className="max-w-2xl text-body text-muted">
        Classroom devices listen for these words. A match only flags an alert for review; it doesn&apos;t confirm
        anything happened.
      </p>

      <AddWordForm
        onAdded={(term) => setTerms((current) => current && { ...current, school_terms: [...current.school_terms, term] })}
      />

      <Panel title="Our school's words" description="Words this school added. Other schools don't see them." bodyClassName="">
        {terms.school_terms.length === 0 ? (
          <EmptyState title="No words added yet">
            Add local slang or names above if students here are bullied with words that aren&apos;t on the EchoSense
            list.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {terms.school_terms.map((term) => (
              <li key={term.id} className="flex min-h-11 items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                <span className="min-w-0">
                  <span className="block truncate text-body font-medium text-ink">{term.text}</span>
                  <span className="text-small text-muted">{languageLabel(term.language)}</span>
                </span>
                <Button size="sm" icon={Trash2} onClick={() => setRemoveTarget(term)} aria-label={`Remove ${term.text}`}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="EchoSense word list"
        description={
          offCount > 0
            ? `Shared by every school. ${offCount} turned off for your school.`
            : "Shared by every school. Turn a word off if it causes false alarms here."
        }
        bodyClassName=""
      >
        <div className="border-b border-line px-4 py-3 sm:px-5">
          <label htmlFor="global-word-filter" className="sr-only">
            Find a word
          </label>
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="global-word-filter"
              type="search"
              placeholder="Find a word"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className={`${inputClass} mt-0 pl-9`}
            />
          </div>
        </div>
        {visibleGlobal.length === 0 ? (
          <EmptyState title={terms.global_terms.length === 0 ? "The word list is empty" : "No matching words"}>
            {terms.global_terms.length === 0
              ? "The platform administrator hasn't added any words yet."
              : "Check the spelling, or clear the search to see every word."}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line px-4 sm:px-5">
            {visibleGlobal.map((term) => (
              <li key={term.term_id} className="flex min-h-11 items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span
                    className={`block truncate text-body font-medium ${term.enabled_for_school ? "text-ink" : "text-muted line-through"}`}
                  >
                    {term.text}
                  </span>
                  <span className="text-small text-muted">
                    {languageLabel(term.language)} · {term.enabled_for_school ? "On for our school" : "Turned off for our school"}
                  </span>
                </span>
                <Button
                  size="sm"
                  icon={term.enabled_for_school ? EyeOff : Eye}
                  pending={pendingId === term.term_id}
                  aria-label={`${term.enabled_for_school ? "Turn off for our school" : "Turn back on for our school"}: ${term.text}`}
                  onClick={() => void toggleGlobal(term.term_id, !term.enabled_for_school)}
                >
                  {term.enabled_for_school ? "Turn off for our school" : "Turn back on"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {removeTarget && (
        <ConfirmDialog
          title={`Stop listening for “${removeTarget.text}”?`}
          description="Classroom devices at this school will no longer flag this word. You can add it again later."
          confirmLabel="Remove word"
          pending={removing}
          onConfirm={() => void handleRemove()}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </div>
  );
}
