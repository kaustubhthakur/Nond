"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { uploadAvatar } from "@/lib/user";
import { VerifyField } from "@/components/VerifyField";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
}) {
  return (
    <div className="border border-line rounded-xl px-5 py-6 flex flex-col items-center justify-center gap-1.5 bg-paper hover:border-accent/30 hover:shadow-sm transition-all duration-200">
      <span className="font-display text-3xl text-ink tabular-nums">
        {loading ? (
          <span className="inline-block h-8 w-10 animate-pulse bg-ink/10 rounded" />
        ) : (
          (value ?? 0).toLocaleString()
        )}
      </span>
      <span className="eyebrow text-ink/45 text-[10px] tracking-widest uppercase">
        {label}
      </span>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-line/60 last:border-b-0">
      <dt className="text-sm text-ink/50">{label}</dt>
      <dd className="text-sm text-ink font-medium">{children}</dd>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isLoading, refreshUser } = useAuth();
  const { store, stats, loadingStats, statsError, refetchStats } = useStore();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center text-sm text-ink/50">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center text-sm text-ink/50">
        You need to sign in to view this page.
      </div>
    );
  }

  const initials = user.username.slice(0, 2).toUpperCase();

  const handleAvatarClick = () => {
    if (uploadingAvatar) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarError(null);
    try {
      await uploadAvatar(user.id, file);
      await refreshUser();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Hero header */}
      <section className="rounded-2xl border border-line bg-paper overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-accent/15 via-accent/5 to-transparent" />
        <div className="px-6 sm:px-8 pb-6 -mt-10 flex items-end gap-5">
          <div className="flex flex-col items-start gap-1.5">
            <button
              type="button"
              onClick={handleAvatarClick}
              title="Update profile picture"
              className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 border-4 border-paper shadow-sm ring-1 ring-line font-mono text-xl text-accent overflow-hidden hover:ring-accent transition-all"
            >
              {uploadingAvatar ? (
                <span className="text-xs text-accent">…</span>
              ) : user.avatar ? (
                <Image
                  src={`${API_BASE_URL}${user.avatar}`}
                  alt={`${user.username}'s avatar`}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </button>
            {avatarError && (
              <p className="text-xs text-rust max-w-[160px]">{avatarError}</p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div className="pb-1 min-w-0">
            <h1 className="font-display italic text-2xl text-ink tracking-wide truncate">
              {user.username}
            </h1>
            <p className="text-sm text-ink/55 truncate">{user.email}</p>
          </div>
        </div>
      </section>

      {/* Account details */}
      <section className="space-y-4">
        <h2 className="eyebrow text-ink/50 text-xs tracking-widest uppercase">
          Account details
        </h2>
        <div className="rounded-xl border border-line bg-paper px-6">
          <dl>
            <DetailRow label="Phone">{user.phone || "—"}</DetailRow>
            <DetailRow label="Email verified">
              <VerifyField type="email" userId={user.id} verified={user.email_verified} />
            </DetailRow>
            <DetailRow label="Phone verified">
              <VerifyField type="phone" userId={user.id} verified={user.phone_verified} />
            </DetailRow>
            <DetailRow label="Member since">
              {new Date(user.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </DetailRow>
          </dl>
        </div>
      </section>

      {/* Store inventory overview */}
      {store ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="eyebrow text-ink/50 text-xs tracking-widest uppercase">
              {store.store_name} · inventory overview
            </h2>
            <button
              type="button"
              onClick={refetchStats}
              disabled={loadingStats}
              className="eyebrow text-[11px] text-ink/40 hover:text-accent transition-colors disabled:opacity-50"
            >
              {loadingStats ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {statsError ? (
            <div className="border border-rust/40 bg-rust/5 text-rust text-sm px-4 py-3 rounded-lg">
              {statsError}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Warehouses" value={stats?.warehouses} loading={loadingStats && !stats} />
              <StatCard label="Shelves" value={stats?.shelves} loading={loadingStats && !stats} />
              <StatCard label="Subshelves" value={stats?.subshelves} loading={loadingStats && !stats} />
              <StatCard label="Boxes" value={stats?.boxes} loading={loadingStats && !stats} />
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-line px-6 py-10 text-center">
          <p className="text-sm text-ink/50">You haven&apos;t set up a store yet.</p>
        </section>
      )}
    </div>
  );
}