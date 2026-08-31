"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MinusCircle, Search, X } from "lucide-react";
import { searchProducts } from "@/lib/search";
import type { SearchResult } from "@/types/search";

export function GlobalSearch({
  storeId,
  onSell,
}: {
  storeId: string;
  onSell: (result: SearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const { results } = await searchProducts(storeId, trimmed);
        setResults(results);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not search products."
        );
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [query, storeId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2">
        <Search className="h-4 w-4 shrink-0 text-ink/40" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search products by name or SKU…"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/40"
        />
        {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink/40" />}
        {!loading && query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="text-ink/40 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-lg">
          {error && (
            <p className="px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          {!error && !loading && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-ink/50">
              No products match “{query.trim()}”.
            </p>
          )}

          {!error && results.length > 0 && (
            <ul className="max-h-80 overflow-y-auto">
              {results.map((r) => (
                <li
                  key={r.product.id}
                  className="flex items-center justify-between gap-3 border-b border-ink/5 px-4 py-3 last:border-0 hover:bg-ink/[0.03]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">
                      {r.product.name ?? "Unnamed product"}
                      {r.product.sku && (
                        <span className="ml-2 font-mono text-xs text-ink/40">
                          {r.product.sku}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-ink/50">{r.path}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-sm text-ink">
                      {r.product.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSell(r)}
                      title="Sell / remove stock"
                      className="rounded-full border border-ink/10 p-1.5 text-ink/50 hover:border-red-700/40 hover:text-red-700"
                    >
                      <MinusCircle className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}