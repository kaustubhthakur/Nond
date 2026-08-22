"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { ApiError } from "@/types/auth";
import {
  ErrorNote,
  LedgerCard,
  NoticeNote,
  PageShell,
  PrimaryButton,
} from "@/components/ui";

function VerifyPhoneForm() {
  const params = useSearchParams();
  const userId = params.get("userId") ?? "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const confirm = async () => {
    setError(null);
    setLoading(true);
    try {
      await authApi.verifyPhone(userId);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not verify phone.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LedgerCard step="Contact record" title="Confirm your phone">
      <ErrorNote message={error} />
      <NoticeNote message={done ? "Phone marked as verified." : null} />
      {!done && (
        <PrimaryButton type="button" loading={loading} onClick={confirm} disabled={!userId}>
          Mark phone verified
        </PrimaryButton>
      )}
    </LedgerCard>
  );
}

export default function VerifyPhonePage() {
  return (
    <PageShell>
      <Suspense fallback={null}>
        <VerifyPhoneForm />
      </Suspense>
    </PageShell>
  );
}