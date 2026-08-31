"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError } from "@/types/auth";
import { CreateBoxPayload } from "@/types/box";

interface AddBoxModalProps {
  subShelfName: string;
  availableCapacity: number;
  onClose: () => void;
  onAdd: (payload: CreateBoxPayload) => Promise<void>;
}

export function AddBoxModal({
  subShelfName,
  availableCapacity,
  onClose,
  onAdd,
}: AddBoxModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Box name is required");
      return;
    }

    if (availableCapacity <= 0) {
      setError(
        "This sub-shelf already has the maximum number of boxes"
      );
      return;
    }

    setSubmitting(true);

    try {
      await onAdd({
        name: trimmedName,
      });

      setName("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to create box"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-md bg-paper border border-line p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display italic text-xl text-ink">
            Add box to {subShelfName}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-ink/40 hover:text-ink text-lg leading-none disabled:opacity-50"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label
              className="eyebrow text-ink/60"
              htmlFor="box-name"
            >
              Name
            </label>

            <input
              id="box-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              placeholder="e.g. Box A"
              autoFocus
              disabled={submitting}
            />
          </div>

          <div className="border border-line px-3 py-2">
            <p className="eyebrow text-ink/60">
              Capacity
            </p>

            <p className="text-sm text-ink mt-1">
              25 units
            </p>

            <p className="text-xs text-ink/40 mt-1">
              Each box can hold up to 25 units.
            </p>
          </div>

          <div className="text-xs text-ink/40">
            {availableCapacity} box
            {availableCapacity === 1 ? "" : "es"} available
            on this sub-shelf
          </div>

          {error && (
            <p className="text-xs text-rust">
              {error}
            </p>
          )}

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
              disabled={
                submitting ||
                availableCapacity <= 0
              }
              className="eyebrow border border-accent bg-accent text-paper px-3 py-1.5 hover:bg-transparent hover:text-accent transition-colors disabled:opacity-50"
            >
              {submitting
                ? "Creating…"
                : "Add box"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}