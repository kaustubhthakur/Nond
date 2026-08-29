"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyStores } from "@/lib/store";

type GuardMode = "require-store" | "require-no-store";
  
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
      
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, router]);

  return { checking };
}