"use client";

import { useState } from "react";
import { Shelf } from "@/types/shelf";

interface ShelfCardProps {
  shelf: Shelf;
  onDelete: (shelf: Shelf) => Promise<void>;
}

export function ShelfCard({ shelf, onDelete }: ShelfCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const percent =
    shelf.capacity > 0
      ? Math.min(
          100,
          Math.round((shelf.productQuantity / shelf.capacity) * 100)
        )
      : 0;

  const barColor =
    percent >= 90 ? "bg-rust" : percent >= 65 ? "bg-accent/70" : "bg-accent";

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(shelf);
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
            {shelf.name}
          </h3>
          <p className="text-xs text-ink/50 mt-0.5">
            Up to {shelf.maxSubShelves} sub-shelves
          </p>
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

      {shelf.description ? (
        <p className="text-sm text-ink/70 leading-relaxed">
          {shelf.description}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between text-xs text-ink/60">
          <span className="eyebrow">Products stored</span>
          <span>
            {shelf.productQuantity} / {shelf.capacity} ({percent}%)
          </span>
        </div>

        <div className="h-2 w-full bg-ink/10 overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="text-xs text-ink/50">
          {shelf.availableCapacity.toLocaleString()} unit
          {shelf.availableCapacity === 1 ? "" : "s"} of space left
        </p>
      </div>
    </div>
  );
}