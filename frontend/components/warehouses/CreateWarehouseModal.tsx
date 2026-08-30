"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError } from "@/types/auth";
import { CreateWarehousePayload } from "@/types/warehouse";

interface CreateWarehouseModalProps {
  storeId: string;
  shelfCapacityOptions: number[];
  onClose: () => void;
  onCreate: (payload: CreateWarehousePayload) => Promise<void>;
}

export function CreateWarehouseModal({
  storeId,
  shelfCapacityOptions,
  onClose,
  onCreate,
}: CreateWarehouseModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [shelfCapacity, setShelfCapacity] = useState<number | "">(
    shelfCapacityOptions[0] ?? ""
  );
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

    if (!name.trim()) {
      setError("Warehouse name is required");
      return;
    }

    if (shelfCapacity === "") {
      setError("Choose a shelf capacity");
      return;
    }

    setSubmitting(true);
    try {
      await onCreate({
        storeId,
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        shelfCapacity: Number(shelfCapacity),
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to create warehouse"
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
            New warehouse
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
            <label className="eyebrow text-ink/60" htmlFor="wh-name">
              Name
            </label>
            <input
              id="wh-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              placeholder="Main distribution center"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="eyebrow text-ink/60" htmlFor="wh-capacity">
              Shelf capacity
            </label>
            <select
              id="wh-capacity"
              value={shelfCapacity}
              onChange={(e) => setShelfCapacity(Number(e.target.value))}
              className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
            >
              {shelfCapacityOptions.map((option) => (
                <option key={option} value={option}>
                  {option} shelves
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="eyebrow text-ink/60" htmlFor="wh-address">
              Address <span className="normal-case text-ink/40">(optional)</span>
            </label>
            <input
              id="wh-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={500}
              className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              placeholder="221B Baker Street"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="eyebrow text-ink/60" htmlFor="wh-description">
              Description{" "}
              <span className="normal-case text-ink/40">(optional)</span>
            </label>
            <textarea
              id="wh-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent resize-none"
              placeholder="What is stored here, notes for the team, etc."
            />
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
              disabled={submitting}
              className="eyebrow border border-accent bg-accent text-paper px-3 py-1.5 hover:bg-transparent hover:text-accent transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create warehouse"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}