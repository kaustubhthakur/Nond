import { AlertTriangle, Bell, CheckCircle2, PackageX } from "lucide-react";
import type { LowStockItem } from "@/types/dashboardStats";

function getSeverity(quantity: number) {
  if (quantity <= 0) {
    return {
      label: "Out of stock",
      dot: "bg-red-500",
      badge: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
    };
  }
  return {
    label: "Low",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  };
}

export function LowStockTable({ items }: { items: LowStockItem[] }) {
  const hasItems = items.length > 0;

  return (
    <div className="rounded-2xl border border-line bg-paper shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Bell className="h-4 w-4" />
          </span>
          <h3 className="text-base font-semibold text-ink">Low Stock Alert</h3>
        </div>

        {hasItems ? (
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200 tabular-nums">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Healthy
          </span>
        )}
      </div>

      {/* Body */}
      {!hasItems ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5.5 w-5.5" />
          </span>
          <p className="text-sm font-medium text-ink">All stock levels are healthy</p>
          <p className="text-xs text-ink/40">Nothing needs restocking right now.</p>
        </div>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-ink/[0.015]">
              <th className="border-b border-line px-6 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink/45">
                Product
              </th>
              <th className="border-b border-line px-6 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-ink/45">
                Status
              </th>
              <th className="border-b border-line px-6 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-ink/45">
                Quantity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((item) => {
              const severity = getSeverity(item.quantity);
              return (
                <tr key={item.productId} className="transition-colors hover:bg-ink/[0.015]">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${severity.dot}`} />
                      <span className="truncate text-sm font-medium text-ink">
                        {item.productName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${severity.badge}`}
                    >
                      {item.quantity <= 0 ? (
                        <PackageX className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {severity.label}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span className="text-base font-semibold tabular-nums text-ink">
                      {item.quantity}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}