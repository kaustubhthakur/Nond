"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react";

import { searchProducts } from "@/lib/search";
import type { SearchResult } from "@/types/search";

export function GlobalSearch({
  storeId,
  onAdd,
  onSell,
}: {
  storeId: string;
  onAdd: (result: SearchResult) => Promise<void>;
  onSell: (result: SearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

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
        const { results } = await searchProducts(
          storeId,
          trimmed
        );

        setResults(results);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not search products."
        );
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [query, storeId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        !containerRef.current?.contains(
          e.target as Node
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClick
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClick
      );
  }, []);

  const getResultKey = (result: SearchResult) => {
    const location = result.location;

    return [
      result.product.id,
      location.warehouseId,
      location.shelfId ?? "",
      location.subShelfId ?? "",
      location.boxId ?? "",
    ].join("-");
  };

  const handleAdd = async (result: SearchResult) => {
    const key = getResultKey(result);

    if (updating) return;

    try {
      setUpdating(key);
      setError(null);

      await onAdd(result);

      setResults((current) =>
        current.map((item) =>
          getResultKey(item) === key
            ? {
                ...item,
                product: {
                  ...item.product,
                  quantity:
                    item.product.quantity + 1,
                },
              }
            : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not add stock."
      );
    } finally {
      setUpdating(null);
    }
  };

  const handleSell = (result: SearchResult) => {
    onSell(result);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md"
    >
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

        {loading && (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink/40" />
        )}

        {!loading && query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setError(null);
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
            <p className="px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {!error &&
            !loading &&
            results.length === 0 && (
              <p className="px-4 py-3 text-sm text-ink/50">
                No products match “{query.trim()}”.
              </p>
            )}

          {!error && results.length > 0 && (
            <ul className="max-h-96 overflow-y-auto">
              {results.map((r) => {
                const key = getResultKey(r);
                const isUpdating =
                  updating === key;

                return (
                  <li
                    key={key}
                    className="border-b border-ink/5 px-4 py-3 last:border-0 hover:bg-ink/[0.03]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">
                          {r.product.name ??
                            "Unnamed product"}

                          {r.product.sku && (
                            <span className="ml-2 font-mono text-xs text-ink/40">
                              {r.product.sku}
                            </span>
                          )}
                        </p>

                        <p className="mt-1 truncate text-xs text-ink/50">
                          {r.path}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          disabled={
                            isUpdating ||
                            r.product.quantity <= 0
                          }
                          onClick={() =>
                            handleSell(r)
                          }
                          title="Remove stock"
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/10 text-ink/50 transition hover:border-red-700/40 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>

                        <span className="min-w-[32px] text-center font-mono text-sm font-medium text-ink">
                          {isUpdating ? (
                            <Loader2 className="mx-auto h-4 w-4 animate-spin text-ink/40" />
                          ) : (
                            r.product.quantity
                          )}
                        </span>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            handleAdd(r)
                          }
                          title="Add stock"
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/10 text-ink/50 transition hover:border-emerald-700/40 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}