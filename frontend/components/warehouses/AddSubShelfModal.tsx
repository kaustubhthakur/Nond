"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError } from "@/types/auth";
import { CreateSubShelfPayload } from "@/types/subshelf";

interface AddSubShelfModalProps {
  shelfName: string;
  availableCapacity: number;
  onClose: () => void;
  onAdd: (payload: CreateSubShelfPayload) => Promise<void>;
}

export function AddSubShelfModal({
  shelfName,
  availableCapacity,
  onClose,
  onAdd,
}: AddSubShelfModalProps) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [maxBoxes, setMaxBoxes] = useState("5");
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
      setError("Sub-shelf name is required");
      return;
    }

    const cap = Number(capacity);
    if (!Number.isInteger(cap) || cap <= 0) {
      setError("Capacity must be a positive whole number");
      return;
    }

    if (cap > availableCapacity) {
      setError(
        `Only ${availableCapacity} unit${
          availableCapacity === 1 ? "" : "s"
        } of space left on this shelf`
      );
      return;
    }

    const boxes = Number(maxBoxes);
    if (!Number.isInteger(boxes) || boxes <= 0) {
      setError("Max boxes must be a positive whole number");
      return;
    }

    setSubmitting(true);
    try {
      await onAdd({ name: name.trim(), capacity: cap, maxBoxes: boxes });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to create sub-shelf"
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
            Add sub-shelf to {shelfName}
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
            <label className="eyebrow text-ink/60" htmlFor="subshelf-name">
              Name
            </label>
            <input
              id="subshelf-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              placeholder="e.g. Boxes 1"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="eyebrow text-ink/60" htmlFor="subshelf-capacity">
              Capacity
            </label>
            <input
              id="subshelf-capacity"
              type="number"
              min={1}
              max={availableCapacity}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              placeholder="e.g. 125"
            />
            <p className="text-xs text-ink/40">
              {availableCapacity.toLocaleString()} unit
              {availableCapacity === 1 ? "" : "s"} of space left on this shelf
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="eyebrow text-ink/60" htmlFor="subshelf-max-boxes">
              Max boxes
            </label>
            <input
              id="subshelf-max-boxes"
              type="number"
              min={1}
              value={maxBoxes}
              onChange={(e) => setMaxBoxes(e.target.value)}
              className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
            />
            <p className="text-xs text-ink/40">
              How many boxes this sub-shelf can hold
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
              {submitting ? "Creating…" : "Add sub-shelf"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}