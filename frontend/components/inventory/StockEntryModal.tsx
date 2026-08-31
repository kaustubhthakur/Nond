"use client";

import { FormEvent, useState } from "react";
import { Loader2, X } from "lucide-react";

export function StockEntryModal({
  open,
  targetLabel,
  onClose,
  onSubmit,
}: {
  open: boolean;
  targetLabel: string;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    sku?: string;
    quantity: number;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const reset = () => {
    setName("");
    setSku("");
    setQuantity("1");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const qty = Number(quantity);
    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        sku: sku.trim() || undefined,
        quantity: qty,
      });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="eyebrow mb-1">Stock entry</p>
            <h2 className="font-display text-lg text-ink">{targetLabel}</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1 text-ink/40 hover:bg-ink/5 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-ink/60">
              Product name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
              placeholder="e.g. Cotton tote bag"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-ink/60">
              SKU (optional)
            </label>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
              placeholder="e.g. TOTE-001"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-ink/60">
              Quantity
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-ink/40"
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full px-4 py-2 text-sm text-ink/60 hover:bg-ink/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Add stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}