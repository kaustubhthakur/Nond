import { Bell } from "lucide-react";
import type { LowStockItem } from "@/types/dashboardStats";

export function LowStockTable({ items }: { items: LowStockItem[] }) {
  return (
    <div className="rounded-2xl border border-line bg-paper shadow-sm">
      <div className="flex items-center gap-2 border-b border-line px-6 py-4 text-base font-semibold text-ink">
        <Bell className="h-5 w-5" />
        Low Stock Alert
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b border-line px-6 py-3 text-left text-sm font-medium text-ink/60">Product</th>
            <th className="border-b border-line px-6 py-3 text-right text-sm font-medium text-ink/60">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-6 py-10 text-center text-ink/40">No low-stock items.</td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.productId}>
                <td className="border-b border-line px-6 py-3.5 text-sm text-ink">{item.productName}</td>
                <td className="border-b border-line px-6 py-3.5 text-right text-base font-semibold text-red-600">{item.quantity}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}