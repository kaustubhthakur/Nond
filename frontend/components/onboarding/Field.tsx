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
      <label htmlFor={htmlFor} className="block text-sm text-ink">
        {label}
        {optional && <span className="ml-1.5 text-xs text-ink/40">optional</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-ink/50">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-700">{error}</p>}
    </div>
  );
}