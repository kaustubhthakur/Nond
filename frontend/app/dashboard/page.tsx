"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyStores } from "@/lib/store";
import type { Store } from "@/types/store";

export default function DashboardPage() {
  const { user } = useAuth();
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
      <header className="mb-10">
        <p className="eyebrow mb-2">Dashboard</p>
        <h1 className="font-display text-3xl text-ink">
          Welcome back{user ? `, ${user.username}` : ""}.
        </h1>
      </header>

      {loading && (
        <p className="font-mono text-sm text-ink/50">Loading your stores…</p>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}

      {!loading && !error && stores.length === 0 && (
        <p className="text-ink/60">You don&rsquo;t have any stores yet.</p>
      )}

      {!loading && !error && stores.length > 0 && (
        <ul className="space-y-4">
          {stores.map((store) => (
            <li key={store.id} className="ledger-card px-6 py-5">
              <h2 className="font-display text-xl text-ink">{store.store_name}</h2>
              <p className="mt-1 text-sm text-ink/60">
                {store.business_type === "something-else"
                  ? store.business_type_custom
                  : store.business_type}
                {" · "}
                {store.city}, {store.country}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}