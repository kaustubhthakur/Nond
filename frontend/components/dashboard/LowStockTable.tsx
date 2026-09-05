import { Bell } from "lucide-react";
import type { LowStockItem } from "@/types/dashboardStats";

export function LowStockTable({ items }: { items: LowStockItem[] }) {
  return (
    <div className="rounded-2xl border border-line bg-paper shadow-sm">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3 text-sm font-semibold text-ink">
        <Bell className="h-4 w-4" />
        Low Stock Alert
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border-b border-line px-5 py-2 text-left font-medium text-ink/60">Product</th>
            <th className="border-b border-line px-5 py-2 text-right font-medium text-ink/60">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-5 py-6 text-center text-ink/40">No low-stock items.</td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.productId}>
                <td className="border-b border-line px-5 py-2 text-ink">{item.productName}</td>
                <td className="border-b border-line px-5 py-2 text-right font-semibold text-red-600">{item.quantity}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}