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
    <div className="border border-line rounded-lg p-5 flex flex-col items-center justify-center gap-1 bg-paper">
      <span className="font-display text-3xl text-ink">
        {loading ? (
          <span className="inline-block h-8 w-8 animate-pulse bg-ink/10 rounded" />
        ) : (
          value ?? "–"
        )}
      </span>
      <span className="eyebrow text-ink/50 text-xs tracking-wide uppercase">
        {label}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isLoading, refreshUser } = useAuth();
  const { store, stats, loadingStats, statsError, refetchStats } = useStore();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center text-ink/50">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center text-ink/50">
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
    try {
      await uploadAvatar(user.id, file);
      await refreshUser();
    } catch {
      // could surface a toast/error state here if you want
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <section className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleAvatarClick}
          title="Update profile picture"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 border border-accent/30 font-mono text-lg text-accent overflow-hidden hover:border-accent transition-colors"
        >
          {uploadingAvatar ? (
            <span className="text-xs text-accent">...</span>
          ) : user.avatar ? (
            <Image
              src={`${API_BASE_URL}${user.avatar}`}
              alt={`${user.username}'s avatar`}
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <div>
          <h1 className="font-display italic text-2xl text-ink">
            {user.username}
          </h1>
          <p className="text-sm text-ink/60">{user.email}</p>
        </div>
      </section>

      {/* Account details */}
      <section className="border-t border-line pt-6 space-y-3">
        <h2 className="eyebrow text-ink/50 text-xs tracking-wide uppercase">
          Account details
        </h2>
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-ink/50">Phone</dt>
          <dd className="text-ink">{user.phone || "—"}</dd>

          <dt className="text-ink/50">Email verified</dt>
          <dd>
            <VerifyField type="email" userId={user.id} verified={user.email_verified} />
          </dd>

          <dt className="text-ink/50">Phone verified</dt>
          <dd>
            <VerifyField type="phone" userId={user.id} verified={user.phone_verified} />
          </dd>

          <dt className="text-ink/50">Member since</dt>
          <dd className="text-ink">
            {new Date(user.created_at).toLocaleDateString()}
          </dd>
        </dl>
      </section>

      {/* Store inventory overview */}
      {store ? (
        <section className="border-t border-line pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="eyebrow text-ink/50 text-xs tracking-wide uppercase">
              {store.store_name} — inventory overview
            </h2>
            <button
              type="button"
              onClick={refetchStats}
              disabled={loadingStats}
              className="text-xs text-ink/40 hover:text-accent transition-colors disabled:opacity-50"
            >
              {loadingStats ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          {statsError ? (
            <p className="text-sm text-rust">{statsError}</p>
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
        <section className="border-t border-line pt-6">
          <p className="text-sm text-ink/50">You haven&apos;t set up a store yet.</p>
        </section>
      )}
    </div>
  );
}