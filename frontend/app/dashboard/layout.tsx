"use client";

import { useOnboardingGuard } from "@/hooks/useOnboardingGuard";
import { useRequireAuth } from "@/lib/use-require-auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { checking: authChecking } = useRequireAuth();
  const { checking: onboardingChecking } = useOnboardingGuard("require-store");

  const checking = authChecking || onboardingChecking;

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-sm text-ink/50">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}