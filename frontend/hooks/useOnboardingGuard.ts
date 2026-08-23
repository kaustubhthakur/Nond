"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyStores } from "@/lib/api/store";

type GuardMode = "require-store" | "require-no-store";

/**
 * Keeps first-time users inside /onboarding until they've created a
 * store, and keeps users who already have one out of /onboarding.
 *
 * Usage:
 *   useOnboardingGuard("require-store");     // in app/dashboard/layout.tsx
 *   useOnboardingGuard("require-no-store");  // in app/onboarding/page.tsx (via OnboardingWizard)
 */
export function useOnboardingGuard(mode: GuardMode) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getMyStores()
      .then(({ stores }) => {
        if (cancelled) return;
        const hasStore = stores.length > 0;

        if (mode === "require-store" && !hasStore) {
          router.replace("/onboarding");
          return;
        }

        if (mode === "require-no-store" && hasStore) {
          router.replace("/dashboard");
          return;
        }

        setChecking(false);
      })
      .catch(() => {
        // If the check itself fails (e.g. expired token), let the
        // page's own auth guard redirect to /login instead of
        // blocking here.
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, router]);

  return { checking };
}