"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError } from "@/types/auth";
import { AddProductToShelfPayload } from "@/types/shelf";

interface AddProductModalProps {
  shelfName: string;
  availableCapacity: number;
  onClose: () => void;
  onAdd: (payload: AddProductToShelfPayload) => Promise<void>;
}

export function AddProductModal({
  shelfName,
  availableCapacity,
  onClose,
  onAdd,
}: AddProductModalProps) {
  const [productId, setProductId] = useState("");
  const [logo, setLogo] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productId.trim()) {
      setError("Product ID is required");
      return;
    }

    const productPrice = Number(price);
    if (
      price.trim() === "" ||
      !Number.isFinite(productPrice) ||
      productPrice < 0
    ) {
      setError("Price must be a valid non-negative number");
      return;
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      setError("Quantity must be a positive whole number");
      return;
    }

    if (qty > availableCapacity) {
      setError(
        `Only ${availableCapacity} unit${
          availableCapacity === 1 ? "" : "s"
        } of space left on this shelf`
      );
      return;
    }

    setSubmitting(true);
    try {
      await onAdd({
        productId: productId.trim(),
        logo: logo.trim() ? logo.trim() : undefined,
        price: productPrice,
        quantity: qty,
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to add product"
      );
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-md bg-paper border border-line p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display italic text-xl text-ink">
            Add product to {shelfName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink/40 hover:text-ink text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="eyebrow text-ink/60" htmlFor="product-id">
              Product ID
            </label>
            <input
              id="product-id"
              type="text"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              placeholder="e.g. PROD-1042"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="eyebrow text-ink/60" htmlFor="product-logo">
              Logo URL <span className="text-ink/30">(optional)</span>
            </label>
            <input
              id="product-logo"
              type="url"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="eyebrow text-ink/60" htmlFor="product-price">
              Price
            </label>
            <input
              id="product-price"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              placeholder="e.g. 49.99"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="eyebrow text-ink/60" htmlFor="product-qty">
              Quantity
            </label>
            <input
              id="product-qty"
              type="number"
              min={1}
              max={availableCapacity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
            />
            <p className="text-xs text-ink/40">
              {availableCapacity.toLocaleString()} unit
              {availableCapacity === 1 ? "" : "s"} of space left on this shelf
            </p>
          </div>

          {error ? <p className="text-xs text-rust">{error}</p> : null}

          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="eyebrow border border-ink/20 px-3 py-1.5 text-ink/60 hover:text-ink transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || availableCapacity <= 0}
              className="eyebrow border border-accent bg-accent text-paper px-3 py-1.5 hover:bg-transparent hover:text-accent transition-colors disabled:opacity-50"
            >
              {submitting ? "Adding…" : "Add product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}