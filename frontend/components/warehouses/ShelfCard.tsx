"use client";

import { Shelf } from "@/types/shelf";
import { CapacityRing } from "./CapacityRing";

interface ShelfCardProps {
  shelf: Shelf;
  onOpen: (shelf: Shelf) => void;
}

function StatusPill({ full }: { full: boolean }) {
  return (
    <span
      className={`eyebrow text-[10px] px-2.5 py-1 rounded-full whitespace-nowrap ${
        full ? "bg-rust/10 text-rust" : "bg-accent/10 text-accent"
      }`}
    >
      {full ? "Full" : "Open"}
    </span>
  );
}

export function ShelfCard({ shelf, onOpen }: ShelfCardProps) {
  const shelfFull = shelf.availableCapacity <= 0;

  return (
    <button
      type="button"
      onClick={() => onOpen(shelf)}
      className="text-left rounded-xl border border-line bg-paper shadow-sm hover:border-accent/50 hover:shadow-md transition-all duration-200 p-6 flex flex-col gap-4"
    >
      <div className="flex items-start gap-4">
        <CapacityRing
          used={shelf.productQuantity}
          capacity={shelf.capacity}
          size={56}
          thickness={6}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display italic text-lg text-ink tracking-wide leading-snug break-words">
              {shelf.name}
            </h3>
            <StatusPill full={shelfFull} />
          </div>
          <p className="text-xs text-ink/50 mt-1 font-mono">
            {shelf.productQuantity.toLocaleString()} / {shelf.capacity.toLocaleString()} units
          </p>
        </div>
      </div>

      {shelf.description ? (
        <p className="text-sm text-ink/70 leading-relaxed line-clamp-2">
          {shelf.description}
        </p>
      ) : null}

      <div className="pt-3 border-t border-line/70 flex items-center justify-between text-xs text-ink/45">
        <span>
          {shelf.availableCapacity.toLocaleString()} unit
          {shelf.availableCapacity === 1 ? "" : "s"} left
        </span>
        <span>up to {shelf.maxSubShelves} sub-shelves</span>
      </div>
    </button>
  );
}