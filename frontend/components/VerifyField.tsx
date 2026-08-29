"use client";

import { useState } from "react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface VerifyFieldProps {
  type: "email" | "phone";
  userId: string | number;
  verified: boolean;
}

export function VerifyField({ type, userId, verified }: VerifyFieldProps) {
  const { refreshUser } = useAuth();
  const [stage, setStage] = useState<"idle" | "otp-sent" | "verifying">("idle");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSendOtp = async () => {
    setError(null);
    setSending(true);
    try {
      await authApi.sendOtp({ userId, method: "email" });
      setStage("otp-sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return;
    setError(null);
    setStage("verifying");
    try {
      await authApi.verifyOtp({ userId, otp: otp.trim(), method: "email" });

      if (type === "email") {
        await authApi.verifyEmail(userId);
      } else {
        await authApi.verifyPhone(userId);
      }

      await refreshUser();
      setStage("idle");
      setOtp("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code, try again");
      setStage("otp-sent");
    }
  };

  if (verified) {
    return <span className="text-ink">Yes</span>;
  }

  if (stage === "idle") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-ink">No</span>
        <button
          type="button"
          onClick={handleSendOtp}
          disabled={sending}
          className="text-xs text-accent hover:underline disabled:opacity-50"
        >
          {sending ? "Sending…" : "Verify"}
        </button>
        {error && <span className="text-xs text-rust">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter code"
          className="w-28 text-sm border-b border-accent bg-transparent focus:outline-none"
          autoFocus
        />
        <button
          type="button"
          onClick={handleVerifyOtp}
          disabled={stage === "verifying" || !otp.trim()}
          className="text-xs text-accent hover:underline disabled:opacity-50"
        >
          {stage === "verifying" ? "Checking…" : "Submit"}
        </button>
        <button
          type="button"
          onClick={handleSendOtp}
          disabled={sending}
          className="text-xs text-ink/40 hover:text-ink transition-colors"
        >
          Resend
        </button>
      </div>
      <span className="text-xs text-ink/50">Code sent to your email</span>
      {error && <span className="text-xs text-rust">{error}</span>}
    </div>
  );
}