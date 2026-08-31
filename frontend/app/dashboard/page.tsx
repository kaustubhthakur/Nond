"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Store as StoreIcon } from "lucide-react";
import { getMyStores } from "@/lib/store";
import type { Store } from "@/types/store";

export default function DashboardPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyStores()
      .then(({ stores }) => setStores(stores))
      .catch(() => setError("Could not load your stores."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Dashboard</p>
          <h1 className="font-display text-3xl text-ink">Your stores</h1>
        </div>
        <Link
          href="/stores/new"
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-xs text-ink/70 transition-colors hover:border-ink/30 hover:text-ink"
        >
          <Plus className="h-3.5 w-3.5" />
          New store
        </Link>
      </header>

      {loading && <p className="font-mono text-sm text-ink/50">Loading your stores…</p>}

      {error && <p className="text-sm text-red-700">{error}</p>}

      {!loading && !error && stores.length === 0 && (
        <div className="ledger-card flex flex-col items-center gap-3 px-6 py-12 text-center">
          <StoreIcon className="h-5 w-5 text-ink/40" />
          <p className="text-ink/60">You don&rsquo;t have any stores yet.</p>
          <Link
            href="/stores/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs text-paper transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Create your first store
          </Link>
        </div>
      )}

      {!loading && !error && stores.length > 0 && (
        <ul className="space-y-4">
          {stores.map((store) => (
            <li key={store.id}>
              <Link
                href={`/dashboard/inventory/${store.id}`}
                className="ledger-card group flex items-center justify-between gap-4 px-6 py-5 transition-colors hover:border-accent/40"
              >
                <div>
                  <h2 className="font-display text-xl text-ink group-hover:text-accent transition-colors">
                    {store.store_name}
                  </h2>
                  <p className="mt-1 text-sm text-ink/60">
                    {store.business_type === "something-else"
                      ? store.business_type_custom
                      : store.business_type}
                    {" · "}
                    {store.city}, {store.country}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-ink/40 group-hover:text-accent transition-colors">
                  View inventory
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}