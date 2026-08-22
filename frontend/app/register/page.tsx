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
  NoticeNote,
  PageShell,
  PrimaryButton,
} from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      await authApi.register({
        username: form.username,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      setNotice("Account created. Redirecting to sign in…");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <LedgerCard
        step="Step 01 — Open an account"
        title="Create your ledger"
        subtitle="A record is kept of everyone who enters."
      >
        <form onSubmit={handleSubmit}>
          <ErrorNote message={error} />
          <NoticeNote message={notice} />
          <Field
            label="Username"
            type="text"
            required
            value={form.username}
            onChange={update("username")}
            placeholder="j.appleseed"
          />
          <Field
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={update("email")}
            placeholder="you@example.com"
          />
          <Field
            label="Phone (optional)"
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            placeholder="+1 555 000 0000"
          />
          <Field
            label="Password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={update("password")}
            placeholder="••••••••"
          />
          <PrimaryButton type="submit" loading={loading}>
            Open account
          </PrimaryButton>
        </form>
        <FootLink prompt="Already have an entry?" href="/login" label="Sign in" />
      </LedgerCard>
    </PageShell>
  );
}