// Example: how to wire ShelfCard + ShelfDrilldown into your warehouse page.
// Replace the old inline-expanding grid with this — one drilldown panel
// mounted once, controlled by which shelf is currently "open".

"use client";

import { useState } from "react";
import { Shelf } from "@/types/shelf";
import { ShelfCard } from "./ShelfCard";
import { ShelfDrilldown } from "./ShelfDrilldown";

export function ShelfGrid({
  shelves,
  onDeleteShelf,
  onShelfChanged,
}: {
  shelves: Shelf[];
  onDeleteShelf: (shelf: Shelf) => Promise<void>;
  onShelfChanged?: (shelf: Shelf) => void;
}) {
  const [openShelf, setOpenShelf] = useState<Shelf | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {shelves.map((shelf) => (
          <ShelfCard key={shelf.id} shelf={shelf} onOpen={setOpenShelf} />
        ))}
      </div>

      <ShelfDrilldown
        shelf={openShelf}
        onClose={() => setOpenShelf(null)}
        onDeleteShelf={onDeleteShelf}
        onShelfChanged={onShelfChanged}
      />
    </>
  );
}