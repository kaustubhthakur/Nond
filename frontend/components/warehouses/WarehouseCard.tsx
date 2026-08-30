"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Warehouse } from "@/types/warehouse";
import { shelfApi } from "@/lib/shelfApi";

interface WarehouseCardProps {
  warehouse: Warehouse;
  onDelete: (warehouse: Warehouse) => Promise<void>;
}

function FillRing({ percent }: { percent: number }) {
  const size = 64;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  const ringColor =
    percent >= 90 ? "stroke-rust" : percent >= 65 ? "stroke-accent/70" : "stroke-accent";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-ink/10"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className={`${ringColor} transition-all`}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-ink">{percent}%</span>
      </div>
    </div>
  );
}

export function WarehouseCard({ warehouse, onDelete }: WarehouseCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Overall warehouse fill: total products stored (summed across all shelves)
  // vs the warehouse's full theoretical product capacity.
  const [productsUsed, setProductsUsed] = useState<number | null>(null);
  const [usageError, setUsageError] = useState(false);

  const totalProductCapacity =
    warehouse.shelfCapacity *
    warehouse.maxSubShelvesPerShelf *
    warehouse.maxBoxesPerSubShelf *
    warehouse.maxProductsPerBox;

  useEffect(() => {
    let cancelled = false;

    async function loadUsage() {
      try {
        const res = await shelfApi.list(warehouse.storeId, warehouse.id);
        if (cancelled) return;

        const used = res.shelves.reduce((sum, s) => sum + s.productQuantity, 0);
        setProductsUsed(used);
      } catch {
        if (!cancelled) setUsageError(true);
      }
    }

    loadUsage();
    return () => {
      cancelled = true;
    };
  }, [warehouse.storeId, warehouse.id]);

  const hasUsageData = productsUsed !== null;

  const fillPercent =
    hasUsageData && totalProductCapacity > 0
      ? Math.min(100, Math.round((productsUsed / totalProductCapacity) * 100))
      : 0;
  const spaceLeft = Math.max(0, totalProductCapacity - (productsUsed ?? 0));

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(warehouse);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="border border-line bg-paper p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/warehouses/${warehouse.id}`}
            className="font-display italic text-lg text-ink tracking-wide truncate hover:text-accent transition-colors block"
          >
            {warehouse.name}
          </Link>
          {warehouse.address ? (
            <p className="text-xs text-ink/50 mt-0.5 truncate">
              {warehouse.address}
            </p>
          ) : null}
        </div>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="eyebrow shrink-0 border border-ink/20 px-2.5 py-1 text-ink/60 hover:border-rust hover:text-rust transition-colors"
          >
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="eyebrow border border-rust text-rust px-2.5 py-1 hover:bg-rust hover:text-paper transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="eyebrow border border-ink/20 px-2.5 py-1 text-ink/60 hover:text-ink transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {warehouse.description ? (
        <p className="text-sm text-ink/70 leading-relaxed">
          {warehouse.description}
        </p>
      ) : null}

      {/* Overall warehouse fill — ring + numbers */}
      <div className="flex items-center gap-4">
        <FillRing percent={fillPercent} />
        <div className="flex flex-col gap-1 min-w-0">
          <span className="eyebrow text-ink/60">Warehouse filled</span>
          <span className="text-sm text-ink">
            {hasUsageData ? (
              <>
                {productsUsed.toLocaleString()} / {totalProductCapacity.toLocaleString()} units
              </>
            ) : usageError ? (
              <>— / {totalProductCapacity.toLocaleString()} units</>
            ) : (
              <>Loading…</>
            )}
          </span>
          <span className="text-xs text-ink/50">
            {hasUsageData
              ? `${spaceLeft.toLocaleString()} unit${spaceLeft === 1 ? "" : "s"} left`
              : usageError
              ? "Couldn't load usage"
              : ""}
          </span>
        </div>
      </div>

      <div className="border-t border-line pt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-sm text-ink">{warehouse.maxSubShelvesPerShelf}</p>
          <p className="text-[10px] uppercase tracking-wide text-ink/40">
            Sub-shelves / shelf
          </p>
        </div>
        <div>
          <p className="text-sm text-ink">{warehouse.maxBoxesPerSubShelf}</p>
          <p className="text-[10px] uppercase tracking-wide text-ink/40">
            Boxes / sub-shelf
          </p>
        </div>
        <div>
          <p className="text-sm text-ink">
            {totalProductCapacity.toLocaleString()}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-ink/40">
            Max products
          </p>
        </div>
      </div>
    </div>
  );
}