interface DetectedWordsTagsProps {
  hardHits?: string[];
  softHits?: string[];
}

export default function DetectedWordsTags({ hardHits, softHits }: DetectedWordsTagsProps) {
  const hasHard = !!hardHits && hardHits.length > 0;
  const hasSoft = !!softHits && softHits.length > 0;
  if (!hasHard && !hasSoft) return null;

  return (
    <div className="space-y-1.5">
      <span className="text-[11px] text-gray-400 dark:text-gray-500">Detected:</span>
      <div className="flex flex-wrap gap-1.5">
        {(hasHard ? hardHits! : []).map((word, i) => (
          <span
            key={`hard-${word}-${i}`}
            className="px-2.5 py-1 text-xs font-medium rounded-full border bg-red-500/10 text-red-600 border-red-500/25 dark:bg-red-500/15 dark:text-red-400"
          >
            {word}
          </span>
        ))}
        {(hasSoft ? softHits! : []).map((word, i) => (
          <span
            key={`soft-${word}-${i}`}
            className="px-2.5 py-1 text-xs font-medium rounded-full border bg-orange-500/10 text-orange-600 border-orange-500/25 dark:bg-orange-500/15 dark:text-orange-400"
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}
