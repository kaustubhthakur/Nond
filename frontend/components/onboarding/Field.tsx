"use client";

import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}

export default function Field({ label, htmlFor, error, hint, optional, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--onb-ink)]">
        {label}
        {optional && (
          <span className="ml-1.5 text-xs font-normal text-[var(--onb-muted)]">optional</span>
        )}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-[var(--onb-muted)]">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}