"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { uploadAvatar } from "@/lib/user";
import { VerifyField } from "@/components/VerifyField";
import { Store, ShieldCheck, Mail, Phone, Calendar } from "lucide-react";

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
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-line/60 last:border-b-0">
      <dt className="flex items-center gap-2 text-sm text-ink/50">
        {icon}
        {label}
      </dt>
      <dd className="text-sm text-ink font-medium">{children}</dd>
    </div>
  );
}

function formatDate(value: string | number | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

  const fullyVerified = user.email_verified && user.phone_verified;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Hero header */}
      <section className="rounded-2xl border border-line bg-paper overflow-hidden shadow-sm">
        <div className="h-24 bg-gradient-to-r from-accent/20 via-accent/5 to-transparent" />
        <div className="px-6 sm:px-8 pb-7 -mt-11 flex flex-col sm:flex-row sm:items-end gap-5">
          <div className="flex flex-col items-start gap-1.5">
            <button
              type="button"
              onClick={handleAvatarClick}
              title="Update profile picture"
              className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/10 border-4 border-paper shadow-md ring-1 ring-line font-mono text-2xl text-accent overflow-hidden hover:ring-accent transition-all"
            >
              {uploadingAvatar ? (
                <span className="text-xs text-accent">…</span>
              ) : user.avatar ? (
                <Image
                  src={`${API_BASE_URL}${user.avatar}`}
                  alt={`${user.username}'s avatar`}
                  width={96}
                  height={96}
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
          <div className="pb-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display italic text-2xl text-ink tracking-wide truncate">
                {user.username}
              </h1>
              {fullyVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-ink/55 truncate mt-0.5">{user.email}</p>
            {store?.name && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-ink/45">
                <Store className="h-3 w-3" />
                {store.name}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Account details */}
      <section className="space-y-4">
        <h2 className="eyebrow text-ink/50 text-xs tracking-widest uppercase">
          Account details
        </h2>
        <div className="rounded-xl border border-line bg-paper px-6 shadow-sm">
          <dl>
            <DetailRow icon={<Mail className="h-3.5 w-3.5" />} label="Email">
              {user.email || "—"}
            </DetailRow>
            <DetailRow label="Email verified">
              <VerifyField type="email" userId={user.id} verified={user.email_verified} />
            </DetailRow>
            <DetailRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone">
              {user.phone || "—"}
            </DetailRow>
            <DetailRow label="Phone verified">
              <VerifyField type="phone" userId={user.id} verified={user.phone_verified} />
            </DetailRow>
            <DetailRow icon={<Calendar className="h-3.5 w-3.5" />} label="Member since">
              {formatDate(user.created_at)}
            </DetailRow>
          </dl>
        </div>
      </section>

      {/* Store details */}
      <section className="space-y-4">
        <h2 className="eyebrow text-ink/50 text-xs tracking-widest uppercase">
          Store
        </h2>
        <div className="rounded-xl border border-line bg-paper px-6 shadow-sm">
          {store ? (
            <dl>
              <DetailRow icon={<Store className="h-3.5 w-3.5" />} label="Store name">
                {store.name || "—"}
              </DetailRow>
              <DetailRow icon={<Calendar className="h-3.5 w-3.5" />} label="Established">
                {/* Assumption: Store has a `createdAt` field marking when it was set up.
                    Adjust the key below if your Store type names it differently
                    (e.g. `establishedAt`, `created_at`). */}
                {formatDate((store as any).createdAt ?? (store as any).created_at)}
              </DetailRow>
            </dl>
          ) : (
            <p className="py-6 text-center text-sm text-ink/50">
              No store set up yet.
            </p>
          )}
        </div>

        {statsError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>{statsError}</span>
            <button
              type="button"
              onClick={refetchStats}
              className="text-xs font-medium underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        {store && !statsError && stats && (
          // Assumption: `stats` is a flat object of numeric metrics
          // (e.g. { products: 42, sales: 310, warehouses: 3 }).
          // Update the keys/labels below to match your actual stats shape.
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(stats).map(([key, value]) => (
              <StatCard
                key={key}
                label={key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
                value={typeof value === "number" ? value : undefined}
                loading={loadingStats}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}