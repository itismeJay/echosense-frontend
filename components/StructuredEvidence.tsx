import type { EvidenceObject, EvidenceValue } from "@/lib/types";

export function readableEvidenceLabel(value: string): string {
  const label = value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : "Recorded value";
}

function EvidenceValueView({ value }: { value: EvidenceValue }) {
  if (value === null) return <span>Not recorded</span>;
  if (typeof value === "boolean") return <span>{value ? "Yes" : "No"}</span>;
  if (typeof value === "number" || typeof value === "string") {
    return <span className="break-words">{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span>No recorded items</span>;
    return (
      <ol className="mt-1 space-y-1 pl-5">
        {value.map((item, index) => (
          <li key={index} className="list-decimal">
            <EvidenceValueView value={item} />
          </li>
        ))}
      </ol>
    );
  }
  return <StructuredEvidence evidence={value} nested />;
}

export default function StructuredEvidence({
  evidence,
  nested = false,
}: {
  evidence: EvidenceObject;
  nested?: boolean;
}) {
  const entries = Object.entries(evidence);
  if (entries.length === 0) {
    return <p className="text-sm text-slate-600 dark:text-slate-300">No recorded details.</p>;
  }
  return (
    <dl className={`${nested ? "mt-1" : "mt-3"} space-y-2 text-sm text-slate-700 dark:text-slate-200`}>
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/50">
          <dt className="font-semibold text-slate-900 dark:text-white">
            {readableEvidenceLabel(key)}
          </dt>
          <dd className="mt-1"><EvidenceValueView value={value} /></dd>
        </div>
      ))}
    </dl>
  );
}
