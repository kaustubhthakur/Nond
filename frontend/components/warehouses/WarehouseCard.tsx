"use client";

import { useState } from "react";
import { Warehouse } from "@/types/warehouse";

interface WarehouseCardProps {
  warehouse: Warehouse;
  onDelete: (warehouse: Warehouse) => Promise<void>;
}

export function WarehouseCard({ warehouse, onDelete }: WarehouseCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const shelvesUsed = warehouse.shelvesUsed ?? 0;
  const totalShelves = warehouse.shelfCapacity;
  const shelfPercent =
    totalShelves > 0
      ? Math.min(100, Math.round((shelvesUsed / totalShelves) * 100))
      : 0;
  const shelvesLeft = Math.max(0, totalShelves - shelvesUsed);

  const totalProductCapacity =
    warehouse.shelfCapacity *
    warehouse.maxSubShelvesPerShelf *
    warehouse.maxBoxesPerSubShelf *
    warehouse.maxProductsPerBox;

  const hasUsageData = warehouse.shelvesUsed !== undefined;

  const barColor =
    shelfPercent >= 90
      ? "bg-rust"
      : shelfPercent >= 65
      ? "bg-accent/70"
      : "bg-accent";

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(warehouse);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="border border-line bg-paper p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display italic text-lg text-ink tracking-wide truncate">
            {warehouse.name}
          </h3>
          {warehouse.address ? (
            <p className="text-xs text-ink/50 mt-0.5 truncate">
              {warehouse.address}
            </p>
          ) : null}
        </div>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="eyebrow shrink-0 border border-ink/20 px-2.5 py-1 text-ink/60 hover:border-rust hover:text-rust transition-colors"
          >
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="eyebrow border border-rust text-rust px-2.5 py-1 hover:bg-rust hover:text-paper transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="eyebrow border border-ink/20 px-2.5 py-1 text-ink/60 hover:text-ink transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {warehouse.description ? (
        <p className="text-sm text-ink/70 leading-relaxed">
          {warehouse.description}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between text-xs text-ink/60">
          <span className="eyebrow">Shelves filled</span>
          <span>
            {hasUsageData ? (
              <>
                {shelvesUsed} / {totalShelves} ({shelfPercent}%)
              </>
            ) : (
              <>0 / {totalShelves}</>
            )}
          </span>
        </div>

        <div className="h-2 w-full bg-ink/10 overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all`}
            style={{ width: `${hasUsageData ? shelfPercent : 0}%` }}
          />
        </div>

        <p className="text-xs text-ink/50">
          {hasUsageData
            ? `${shelvesLeft} shelf${shelvesLeft === 1 ? "" : "s"} of space left`
            : `${totalShelves} shelf${totalShelves === 1 ? "" : "s"} of space available`}
        </p>
      </div>

      <div className="border-t border-line pt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-sm text-ink">{warehouse.maxSubShelvesPerShelf}</p>
          <p className="text-[10px] uppercase tracking-wide text-ink/40">
            Sub-shelves / shelf
          </p>
        </div>
        <div>
          <p className="text-sm text-ink">{warehouse.maxBoxesPerSubShelf}</p>
          <p className="text-[10px] uppercase tracking-wide text-ink/40">
            Boxes / sub-shelf
          </p>
        </div>
        <div>
          <p className="text-sm text-ink">
            {totalProductCapacity.toLocaleString()}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-ink/40">
            Max products
          </p>
        </div>
      </div>
    </div>
  );
}