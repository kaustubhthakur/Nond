"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getMyStores } from "@/lib/store";

type GuardMode = "require-store" | "require-no-store";

export function useOnboardingGuard(mode: GuardMode) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

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
        if (!cancelled) router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [mode, user, authLoading, router]);

  return { checking: checking || authLoading };
}