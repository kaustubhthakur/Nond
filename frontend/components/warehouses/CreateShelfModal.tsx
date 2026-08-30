"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError } from "@/types/auth";
import { CreateShelfPayload } from "@/types/shelf";

interface CreateShelfModalProps {
  maxSubShelves: number;
  maxProducts: number;
  onClose: () => void;
  onCreate: (payload: CreateShelfPayload) => Promise<void>;
}

export function CreateShelfModal({
  maxSubShelves,
  maxProducts,
  onClose,
  onCreate,
}: CreateShelfModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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
      setError("Shelf name is required");
      return;
    }

    setSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to create shelf"
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
          <h2 className="font-display italic text-xl text-ink">New shelf</h2>
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
            <label className="eyebrow text-ink/60" htmlFor="shelf-name">
              Name
            </label>
            <input
              id="shelf-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              placeholder="Shelf A"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="eyebrow text-ink/60"
              htmlFor="shelf-description"
            >
              Description{" "}
              <span className="normal-case text-ink/40">(optional)</span>
            </label>
            <textarea
              id="shelf-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent resize-none"
              placeholder="What goes on this shelf"
            />
          </div>

          <p className="text-xs text-ink/40">
            Each shelf supports up to {maxSubShelves} sub-shelves and{" "}
            {maxProducts.toLocaleString()} products total.
          </p>

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
              {submitting ? "Creating…" : "Create shelf"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}