import { highlightTerms } from "@/lib/alert-presentation";

/** A quoted transcript with the matched monitored terms marked. */
export default function TranscriptQuote({
  text,
  terms,
  className = "",
}: {
  text: string;
  terms: string[];
  className?: string;
}) {
  return (
    <q className={`break-words ${className}`}>
      {highlightTerms(text, terms).map((part, index) =>
        part.match ? (
          <mark key={index} className="rounded-tag bg-sev-medium-bg px-0.5 font-semibold text-ink">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </q>
  );
}
