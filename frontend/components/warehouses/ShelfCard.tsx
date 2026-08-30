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
      className={`eyebrow text-[10px] px-2 py-0.5 rounded-full ${
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
      className="text-left rounded-xl border border-line bg-paper shadow-sm hover:border-accent/40 hover:shadow transition-all duration-200 p-5 flex flex-col gap-4"
    >
      <div className="flex items-center gap-3 min-w-0">
        <CapacityRing
          used={shelf.productQuantity}
          capacity={shelf.capacity}
          size={52}
          thickness={6}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display italic text-lg text-ink tracking-wide truncate">
              {shelf.name}
            </h3>
            <StatusPill full={shelfFull} />
          </div>
          <p className="text-xs text-ink/50 mt-0.5 font-mono">
            {shelf.productQuantity.toLocaleString()} / {shelf.capacity.toLocaleString()} units
          </p>
        </div>
      </div>

      {shelf.description ? (
        <p className="text-sm text-ink/70 leading-relaxed -mt-1 line-clamp-2">
          {shelf.description}
        </p>
      ) : null}

      <p className="text-xs text-ink/40">
        {shelf.availableCapacity.toLocaleString()} unit
        {shelf.availableCapacity === 1 ? "" : "s"} left · up to {shelf.maxSubShelves} sub-shelves
      </p>
    </button>
  );
}