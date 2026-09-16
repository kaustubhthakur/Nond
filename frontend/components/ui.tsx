"use client";

import Link from "next/link";
import { ReactNode } from "react";

function Barcode() {
  const widths = [2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1, 4, 2, 1, 3, 1, 2, 2, 1, 3, 1];
  let x = 0;
  const bars = widths
    .map((w, i) => {
      const barW = w * 2;
      const bar = i % 2 === 0 ? { x, w: barW } : null;
      x += barW;
      return bar;
    })
    .filter(Boolean) as { x: number; w: number }[];

  return (
    <svg viewBox="0 0 220 24" className="h-5 w-full max-w-[180px] opacity-70">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={24} className="fill-ink" />
      ))}
    </svg>
  );
}

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
    <div className="relative w-full max-w-md">
      {/* punch hole */}
      <div className="absolute left-1/2 -top-[9px] -translate-x-1/2 h-[18px] w-[18px] rounded-full bg-paper border-2 border-ink z-10" />

      <div className="w-full ledger-card px-8 pt-10 pb-8 sm:px-10 sm:pt-11 sm:pb-9 border border-ink/80 shadow-[4px_4px_0_0] shadow-ink/15">
        <div className="flex items-baseline justify-between mb-6">
          <span className="eyebrow text-ink/40">Tag 0142-A</span>
          {step && <span className="eyebrow text-ink/40">{step}</span>}
        </div>

        <h1 className="font-display text-[1.9rem] leading-tight text-ink mb-1.5">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-ink/60 mb-6 leading-relaxed max-w-[34ch]">
            {subtitle}
          </p>
        )}

        <div className="border-t border-dashed border-ink/25 mb-6" />

        <div>{children}</div>

        <div className="mt-7 pt-5 border-t border-ink/10 flex justify-center">
          <Barcode />
        </div>
      </div>
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
      style={{ clipPath: "polygon(0 0,100% 0,100% 100%,10px 100%,0 calc(100% - 10px))" }}
      className="w-full bg-accent text-paper font-body text-sm tracking-wide py-3 mt-2 transition-all hover:bg-accent-dim active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
    >
      {loading ? "Checking…" : children}
    </button>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="text-sm text-rust border-l-2 border-rust pl-3 py-1 mb-5 leading-relaxed">
      <span className="eyebrow text-rust mr-2">Declined</span>
      {message}
    </p>
  );
}

export function NoticeNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="text-sm text-accent border-l-2 border-accent pl-3 py-1 mb-5 leading-relaxed">
      <span className="eyebrow text-accent mr-2">Noted</span>
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
    <div
      className="flex-1 w-full flex flex-col items-center justify-center px-4 py-16"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.035) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      {children}
    </div>
  );
}