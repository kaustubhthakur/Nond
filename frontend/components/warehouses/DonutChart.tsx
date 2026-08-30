"use client";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSubLabel?: string;
  trackColor?: string;
}


export function DonutChart({
  segments,
  size = 120,
  thickness = 14,
  centerLabel,
  centerSubLabel,
  trackColor = "var(--color-line)",
}: DonutChartProps) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + Math.max(s.value, 0), 0);

  let cumulative = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={thickness}
        />
        {total > 0 &&
          segments.map((seg, i) => {
            if (seg.value <= 0) return null;
            const fraction = seg.value / total;
            const dash = Math.max(fraction * circumference - (segments.length > 1 ? 1.5 : 0), 0);
            const gap = circumference - dash;
            const offset = -(cumulative / total) * circumference;
            cumulative += seg.value;
            return (
              <circle
                key={seg.label + i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            );
          })}
      </svg>
      {(centerLabel || centerSubLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerLabel && (
            <span
              className="font-display italic text-ink leading-none"
              style={{ fontSize: Math.max(size * 0.19, 11) }}
            >
              {centerLabel}
            </span>
          )}
          {centerSubLabel && (
            <span className="eyebrow text-[9px] text-ink/40 mt-1">
              {centerSubLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}


export const PRODUCT_PALETTE = [
  "var(--color-accent)",
  "#C08A2E", // ochre
  "#5B7A8C", // steel blue
  "#7A5C7E", // plum
  "#B4654A", // clay
  "var(--color-rust)",
];

/** Two-tone used/available ring — the fallback when no per-product breakdown exists yet. */
export function capacitySegments(
  used: number,
  capacity: number,
  full: boolean
): DonutSegment[] {
  const available = Math.max(capacity - used, 0);
  const segments: DonutSegment[] = [
    {
      label: "Used",
      value: used,
      color: full ? "var(--color-rust)" : "var(--color-accent)",
    },
  ];
  if (available > 0) {
    segments.push({ label: "Available", value: available, color: "var(--color-line)" });
  }
  return segments;
}


export function productSegments(
  products: { name: string; quantity: number }[] | undefined,
  used: number,
  capacity: number,
  full: boolean
): DonutSegment[] {
  if (!products || products.length === 0) {
    return capacitySegments(used, capacity, full);
  }
  const available = Math.max(capacity - used, 0);
  const segments: DonutSegment[] = products.map((p, i) => ({
    label: p.name,
    value: p.quantity,
    color: PRODUCT_PALETTE[i % PRODUCT_PALETTE.length],
  }));
  if (available > 0) {
    segments.push({ label: "Available", value: available, color: "var(--color-line)" });
  }
  return segments;
}