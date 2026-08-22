"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { ApiError } from "@/types/auth";
import {
  ErrorNote,
  Field,
  FootLink,
  LedgerCard,
  PageShell,
  PrimaryButton,
} from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const params = new URLSearchParams({
        userId: String(res.userId),
        method: res.method,
      });
      router.push(`/verify-otp?${params.toString()}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError(
          `Please wait${
            err.retryAfter ? ` ${err.retryAfter}s` : ""
          } before requesting another code.`
        );
      } else {
        setError(err instanceof ApiError ? err.message : "Sign in failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <LedgerCard
        step="Step 01 — Credentials"
        title="Sign in"
        subtitle="We'll send a one-time code to confirm it's you."
      >
        <form onSubmit={handleSubmit}>
          <ErrorNote message={error} />
          <Field
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <PrimaryButton type="submit" loading={loading}>
            Continue
          </PrimaryButton>
        </form>
        <FootLink prompt="No account yet?" href="/register" label="Open one" />
      </LedgerCard>
    </PageShell>
  );
}