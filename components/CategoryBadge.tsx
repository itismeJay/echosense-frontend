import { categoryBadgeColor, categoryLabel } from "@/lib/format";

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "md";
}

export default function CategoryBadge({ category, size = "sm" }: CategoryBadgeProps) {
  const sizeClass = size === "md"
    ? "px-2.5 py-1 text-xs"
    : "px-2 py-0.5 text-[11px]";
  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${sizeClass} ${categoryBadgeColor(category)}`}>
      {categoryLabel(category)}
    </span>
  );
}
