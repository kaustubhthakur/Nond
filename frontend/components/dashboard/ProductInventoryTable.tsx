"use client";

import { PackagePlus, ShoppingCart, History } from "lucide-react";

export type InventoryRow = {
  rowId: string;
  warehouseId: string;
  category: string;
  quantity: number;
};

export function ProductInventoryTable({
  rows,
  onAdd,
  onSell,
  onTrack,
}: {
  rows: InventoryRow[];
  onAdd: (row: InventoryRow) => void;
  onSell: (row: InventoryRow) => void;
  onTrack: (row: InventoryRow) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-paper shadow-sm">
      <table className="w-full min-w-[800px] border-collapse">
        <thead>
          <tr>
            <th className="border-b border-r border-line px-5 py-3 text-left text-sm font-semibold text-ink">Warehouse No/ID</th>
            <th className="border-b border-r border-line px-5 py-3 text-left text-sm font-semibold text-ink">Category</th>
            <th className="border-b border-r border-line px-5 py-3 text-center text-sm font-semibold text-ink">Qty. in Stock</th>
            <th className="border-b border-r border-line px-5 py-3 text-center text-sm font-semibold text-ink">Add more Qty</th>
            <th className="border-b border-r border-line px-5 py-3 text-center text-sm font-semibold text-ink">Sell Qty</th>
            <th className="border-b border-line px-5 py-3 text-center text-sm font-semibold text-ink">Track product</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-ink/50">No products found.</td></tr>
          ) : (
            rows.map((row) => (
              <tr key={row.rowId} className="hover:bg-ink/[0.02]">
                <td className="border-b border-r border-line px-5 py-3 font-mono text-xs text-ink/70">{row.warehouseId}</td>
                <td className="border-b border-r border-line px-5 py-3 text-sm text-ink">{row.category}</td>
                <td className="border-b border-r border-line px-5 py-3 text-center text-sm font-semibold text-ink">{row.quantity}</td>
                <td className="border-b border-r border-line px-5 py-3 text-center">
                  <button onClick={() => onAdd(row)} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
                    <PackagePlus className="h-3.5 w-3.5" /> Add
                  </button>
                </td>
                <td className="border-b border-r border-line px-5 py-3 text-center">
                  <button onClick={() => onSell(row)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-400 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                    <ShoppingCart className="h-3.5 w-3.5" /> Sell
                  </button>
                </td>
                <td className="border-b border-line px-5 py-3 text-center">
                  <button onClick={() => onTrack(row)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink/70 hover:border-ink/30 hover:text-ink">
                    <History className="h-3.5 w-3.5" /> Product history
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}