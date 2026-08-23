"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { ApiError, OtpMethod } from "@/types/auth";
import { useAuth } from "@/context/AuthContext";
import {
  ErrorNote,
  LedgerCard,
  NoticeNote,
  PageShell,
  PrimaryButton,
} from "@/components/ui";
import { OtpSeal } from "@/components/OtpSeal";

function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setSession } = useAuth();

  const userId = params.get("userId") ?? "";
  const method = (params.get("method") as OtpMethod) ?? "email";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!userId) router.replace("/login");
  }, [userId, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const submit = async (code: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.verifyOtp({ userId, otp: code, method });
      setSession(res.user, res.token);
      setStamped(true);
   setTimeout(() => router.push("/onboarding"), 450);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed.");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(null);
    setNotice(null);
    try {
      await authApi.sendOtp({ userId, method });
      setNotice("A fresh code is on its way.");
      setCooldown(30);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setCooldown(err.retryAfter ?? 30);
        setError("Please wait before requesting another code.");
      } else {
        setError(err instanceof ApiError ? err.message : "Could not resend code.");
      }
    }
  };

  return (
    <LedgerCard
      step="Step 02 — Verification"
      title="Enter the code"
      subtitle={`A 6-digit code was sent to your ${method}. It expires in 5 minutes.`}
    >
      <ErrorNote message={error} />
      <NoticeNote message={notice} />
      <OtpSeal
        value={otp}
        onChange={setOtp}
        onComplete={submit}
        disabled={loading}
        stamped={stamped}
      />
      <PrimaryButton
        type="button"
        loading={loading}
        disabled={otp.length !== 6}
        onClick={() => submit(otp)}
      >
        Confirm
      </PrimaryButton>
      <button
        type="button"
        onClick={resend}
        disabled={cooldown > 0}
        className="w-full text-center text-sm text-ink/50 mt-5 disabled:opacity-40 hover:text-accent transition-colors"
      >
        {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
      </button>
    </LedgerCard>
  );
}

export default function VerifyOtpPage() {
  return (
    <PageShell>
      <Suspense fallback={null}>
        <VerifyOtpForm />
      </Suspense>
    </PageShell>
  );
}