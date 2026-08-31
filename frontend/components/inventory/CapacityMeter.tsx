"use client";

export function CapacityMeter({
  used,
  total,
  label,
}: {
  used: number;
  total: number;
  label?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const tone =
    pct >= 90 ? "bg-red-700" : pct >= 65 ? "bg-amber-600" : "bg-emerald-700";

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between text-xs text-ink/60">
        <span>{label ?? "Capacity"}</span>
        <span className="font-mono">
          {used}/{total}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
        <div
          className={`h-full rounded-full ${tone} transition-[width]`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}