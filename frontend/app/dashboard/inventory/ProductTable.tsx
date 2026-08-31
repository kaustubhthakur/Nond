"use client";

import { MinusCircle, PackageX } from "lucide-react";

export interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
}

export function ProductTable({
  products,
  onSell,
  emptyHint,
}: {
  products: ProductRow[];
  onSell: (product: ProductRow) => void;
  emptyHint?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="ledger-card flex flex-col items-center gap-2 px-6 py-10 text-center">
        <PackageX className="h-5 w-5 text-ink/30" />
        <p className="text-sm text-ink/50">
          {emptyHint ?? "No products here yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="ledger-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/40">
            <th className="px-5 py-3 font-medium">Product</th>
            <th className="px-5 py-3 font-medium">SKU</th>
            <th className="px-5 py-3 font-medium text-right">Quantity</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr
              key={p.id}
              className="border-b border-ink/5 last:border-0 hover:bg-ink/[0.03]"
            >
              <td className="px-5 py-3 text-ink">{p.name}</td>
              <td className="px-5 py-3 font-mono text-ink/50">
                {p.sku ?? "—"}
              </td>
              <td className="px-5 py-3 text-right font-mono text-ink">
                {p.quantity}
              </td>
              <td className="px-5 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onSell(p)}
                  className="inline-flex items-center gap-1 rounded-full border border-ink/10 px-3 py-1 text-xs text-ink/60 transition-colors hover:border-red-700/40 hover:text-red-700"
                >
                  <MinusCircle className="h-3.5 w-3.5" />
                  Sell / remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}