// app/dashboard/layout.tsx
"use client";

import { useOnboardingGuard } from "@/hooks/useOnboardingGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { checking } = useOnboardingGuard("require-store");

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-sm text-ink/50">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}