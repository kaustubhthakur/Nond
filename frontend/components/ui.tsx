"use client";

import Link from "next/link";
import { ReactNode } from "react";

export function LedgerCard({
  step,
  title,
  subtitle,
  children,
}: {
  step?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full max-w-md ledger-card px-8 py-9 sm:px-10 sm:py-10">
      {step && <p className="eyebrow mb-3">{step}</p>}
      <h1 className="font-display text-[1.9rem] leading-tight text-ink mb-1.5">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-ink/60 mb-7 leading-relaxed">{subtitle}</p>
      )}
      <div className={subtitle ? "" : "mt-7"}>{children}</div>
    </div>
  );
}

export function Field({
  label,
  ...props
}: {
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block mb-5">
      <span className="eyebrow block mb-2">{label}</span>
      <input
        {...props}
        className="field-underline w-full py-2 text-[0.95rem] text-ink placeholder:text-ink/30"
      />
    </label>
  );
}

export function PrimaryButton({
  children,
  loading,
  ...props
}: {
  children: ReactNode;
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className="w-full bg-accent text-paper font-body text-sm tracking-wide py-3 mt-2 transition-colors hover:bg-accent-dim disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Working…" : children}
    </button>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="text-sm text-rust border-l-2 border-rust pl-3 py-1 mb-5 leading-relaxed">
      {message}
    </p>
  );
}

export function NoticeNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="text-sm text-accent border-l-2 border-accent pl-3 py-1 mb-5 leading-relaxed">
      {message}
    </p>
  );
}

export function FootLink({
  prompt,
  href,
  label,
}: {
  prompt: string;
  href: string;
  label: string;
}) {
  return (
    <p className="text-sm text-ink/50 mt-7 text-center">
      {prompt}{" "}
      <Link href={href} className="text-accent hover:text-accent-dim underline underline-offset-2">
        {label}
      </Link>
    </p>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <p className="font-display italic text-lg text-ink/70 mb-8 tracking-wide">
        Ledger
      </p>
      {children}
    </main>
  );
}