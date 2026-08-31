"use client";

import { Plus } from "lucide-react";
import { CapacityMeter } from "./CapacityMeter";

export function LevelCard({
  title,
  subtitle,
  used,
  total,
  onOpen,
  onQuickAdd,
}: {
  title: string;
  subtitle?: string;
  used?: number;
  total?: number;
  onOpen: () => void;
  onQuickAdd?: () => void;
}) {
  return (
    <div className="ledger-card group relative flex flex-col justify-between px-5 py-4 text-left transition-shadow hover:shadow-sm">
      <button type="button" onClick={onOpen} className="text-left">
        <h3 className="font-display text-lg text-ink">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-sm text-ink/50">{subtitle}</p>
        )}
      </button>

      {typeof used === "number" && typeof total === "number" && (
        <div className="mt-4">
          <CapacityMeter used={used} total={total} />
        </div>
      )}

      {onQuickAdd && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd();
          }}
          title="Add stock here"
          className="absolute right-3 top-3 rounded-full border border-ink/10 p-1.5 text-ink/50 opacity-0 transition-opacity hover:border-ink/30 hover:text-ink group-hover:opacity-100"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}